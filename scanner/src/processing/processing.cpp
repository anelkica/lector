#include "processing.hpp"

/*
	tesseract wants super duper clean text, black on white!
	as such, we're gonna do a buttload of preprocessing

	1. downscale/upscale (300 dpi)
	2  grayscale
	3. median blur (remove overall noise like salt & pepper)
	4. threshold (convert grayscale to binary black & white)
*/

namespace scanner::processing {
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

	cv::Mat preprocess(const cv::Mat& input) {
		if (input.empty()) 
			return cv::Mat();

		cv::Mat output = scale_to_300dpi(input);

		cv::cvtColor(output, output, cv::COLOR_BGR2GRAY);
		cv::medianBlur(output, output, 3); // kernel size 3x3 is enough for stuff like JPEG
		cv::adaptiveThreshold(output, output, 255, cv::ADAPTIVE_THRESH_GAUSSIAN_C, cv::THRESH_BINARY, 21, 2);

		return output;
	}
}