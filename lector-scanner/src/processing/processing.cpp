#include "processing.hpp"

/*
	tesseract wants super duper clean text, black on white!
	as such, we're gonna do a buttload of preprocessing

	1. downscale/upscale (300 dpi)
	2. grayscale
	3. invert colors if necessary
	4. clahe (improve contrast and edge detection)
	5. deskew
	6. if low contrast:
		1. median blur (remove overall noise like salt & pepper)
		2. threshold (convert grayscale to binary black & white)

	this is enough to scrape by relatively well!

	more tuning can be done such as:
		- tuning magic numbers
		- adding perspective correction
		- detecting and solving edge cases
*/

namespace scanner::processing {
	static cv::Mat scale_to_300dpi(const cv::Mat& input);
	static cv::Mat deskew(const cv::Mat& input);

	cv::Mat preprocess(const cv::Mat& input) {
		if (input.empty())
			return cv::Mat();

		cv::Mat output = scale_to_300dpi(input);

		cv::cvtColor(output, output, cv::COLOR_BGR2GRAY);

		// invert if image is mostly dark (ex. white text on black bg)
		cv::Scalar mean = cv::mean(output);
		if (mean[0] < 127)
			cv::bitwise_not(output, output);

		cv::Ptr<cv::CLAHE> clahe = cv::createCLAHE(2.0, cv::Size(8, 8));
		clahe->apply(output, output); // improve local contrast and enhance edge definition aka clahe

		output = deskew(output);

		double min_val, max_val;
		cv::minMaxLoc(output, &min_val, &max_val);

		double contrast = max_val - min_val;
		if (contrast < 200) {
			// low contrast, clean it up
			cv::medianBlur(output, output, 3); // kernel size 3x3 is enough for stuff like JPEG
			cv::adaptiveThreshold(output, output, 255, cv::ADAPTIVE_THRESH_GAUSSIAN_C, cv::THRESH_BINARY, 21, 2);
		}

		return output;
	}

	// general purpose downscaler/upscaler for most situations (i hope)
	static cv::Mat scale_to_300dpi(const cv::Mat& input) {
		const int TARGET_LONG_SIDE = 2480; // ~300 DPI for Tesseract!!

		int long_side = std::max(input.cols, input.rows);
		if (long_side == TARGET_LONG_SIDE)
			return input.clone(); // perfect size :3

		double scale = (double)TARGET_LONG_SIDE / long_side;
		auto interpolation = scale < 1.0 ? cv::INTER_AREA : cv::INTER_CUBIC; // INTER_AREA downscale, INTER_CUBIC upscale

		cv::Mat output;
		cv::resize(input, output, cv::Size(), scale, scale, interpolation);

		return output;
	}

	static cv::Mat deskew(const cv::Mat& input) {
		// play with magic numbers until it fits :)
		cv::Mat edges;
		cv::Canny(input, edges, 30, 100, 3);

		int min_len = std::max(50, input.rows / 20);
		int max_gap = std::max(10, input.rows / 100);

		std::vector<cv::Vec4i> lines;
		cv::HoughLinesP(edges, lines, 1, CV_PI / 180, 80, min_len, max_gap);

		if (lines.empty())
			return input; // no lines found.. your photos suck

		// collect angles of near-horizontal lines only
		std::vector<double> angles;
		for (const auto& line : lines) {
			double angle = std::atan2(
				line[3] - line[1],
				line[2] - line[0]
			) * 180.0 / CV_PI;

			// only keep near-horizontal lines with this angle
			if (std::abs(angle) < 20.0)
				angles.push_back(angle);
		}

		if (angles.empty())
			return input;

		std::sort(angles.begin(), angles.end());
		double median_angle = angles[angles.size() / 2];

		if (std::abs(median_angle) < 0.5) // skip if angle is little
			return input;

		cv::Point2f center(input.cols / 2.0f, input.rows / 2.0f);
		cv::Mat rotation = cv::getRotationMatrix2D(center, median_angle, 1.0);

		cv::Mat rotated_output;
		cv::warpAffine(
			input, rotated_output, rotation,
			input.size(),
			cv::INTER_CUBIC,
			cv::BORDER_CONSTANT,
			cv::Scalar(255) // fill corners with white, not black
		);

		return rotated_output;
	}
}