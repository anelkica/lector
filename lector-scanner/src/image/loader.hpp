#pragma once
#include <opencv2/opencv.hpp>
#include <expected>

namespace scanner::image {
	enum class LoadError {
		FileNotFound,
		ImageEmpty
	};

	std::string error_to_string(LoadError err);
	std::expected<cv::Mat, LoadError> from_path(const std::string& path);
}