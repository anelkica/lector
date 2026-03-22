#pragma once
#include <opencv2/opencv.hpp>
#include <expected>

namespace scanner::processing {
	cv::Mat preprocess(const cv::Mat& image);
}