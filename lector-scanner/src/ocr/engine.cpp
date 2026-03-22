#include "engine.hpp"
#include <tesseract/baseapi.h>
#include <filesystem>

namespace scanner::ocr {
	struct Engine::TessImpl {
		tesseract::TessBaseAPI api;
	};

	std::string error_to_string(OcrError err) {
		switch (err) {
			case OcrError::InitFailed: return "Tesseract failed to initialize";
			case OcrError::RecognitionFailed: return "Recognition failed";
			case OcrError::EmptyResult: return "No text found in image";
;		}

		return "Undefined eror";
	};

	Engine::Engine(const char* argv_0) : _impl(std::make_unique<TessImpl>()) {
		// WARNING: THIS MOSTLY WORKS FOR WINDOWS - todo: investigate unix solution to get absolute exe path
		std::filesystem::path tessdata =  std::filesystem::absolute(argv_0).parent_path() / "tessdata";

		if (_impl->api.Init(tessdata.string().c_str(), "eng", tesseract::OEM_LSTM_ONLY) != 0)
			throw std::runtime_error(error_to_string(OcrError::InitFailed));

		_impl->api.SetPageSegMode(tesseract::PSM_AUTO); // PSM_AUTO to let it detect stuff on its own
	}

	Engine::~Engine() {
		_impl->api.End();
	}

	std::expected<std::string, OcrError> Engine::recognize(const cv::Mat& image) {
		if (image.empty())
			return std::unexpected(OcrError::RecognitionFailed);
		
		_impl->api.SetImage(
			image.data,
			image.cols,
			image.rows,
			image.channels(),
			image.step
		);

		_impl->api.SetSourceResolution(300); // check loader.cpp, image has been scaled to ~300dpi

		char* raw_text = _impl->api.GetUTF8Text();
		if (!raw_text)
			return std::unexpected(OcrError::RecognitionFailed);

		std::string result(raw_text);
		delete[] raw_text; // very important

		_impl->api.Clear(); 
		
		if (result.empty() || result == "\n")
			return std::unexpected(OcrError::EmptyResult);

		return result;
	}
}