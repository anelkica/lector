#include "processing.hpp"

namespace scanner::processing {
	cv::Mat grayscale(const cv::Mat& image) {
		cv::Mat result;
		cv::cvtColor(image, result, cv::COLOR_BGR2GRAY);
		return result;
	}
}