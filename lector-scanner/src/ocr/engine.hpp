#pragma once
#include <opencv2/opencv.hpp>
#include <expected>

namespace scanner::ocr {
	enum class OcrError {
		InitFailed,
		RecognitionFailed,
		EmptyResult,
		EmptyImage
	};

	std::string error_to_string(OcrError err);

	class Engine {
	public:
		Engine(const char* argv_0);
		~Engine();

		std::expected<std::string, OcrError> recognize(const cv::Mat& image);

	private:
		struct TessImpl;
		std::unique_ptr<TessImpl> _impl; // pimpl
	};
}