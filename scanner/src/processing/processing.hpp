#pragma once
#include <opencv2/opencv.hpp>
#include <expected>

namespace scanner::processing {
	cv::Mat grayscale(const cv::Mat& image);
}