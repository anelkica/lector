#include "image/loader.hpp"
#include "processing/processing.hpp"
#include "ocr/engine.hpp"

#include <CLI/CLI.hpp>
#include <opencv2/core/utils/logger.hpp>

int main(int argc, char* argv[]) {
	cv::utils::logging::setLogLevel(cv::utils::logging::LOG_LEVEL_SILENT); // stfu
	CLI::App app("Scanner - OCR Engine");

	std::string image_path;
	bool show = false;

	app.add_option("image", image_path, "Path to image")
		->required()
		->check(CLI::ExistingFile);
	app.add_flag("--show", show, "Show processed image");

	CLI11_PARSE(app, argc, argv);

	auto image_load_result = scanner::image::from_path(image_path);
	if (!image_load_result) {
		std::cerr << "ERROR: " << scanner::image::error_to_string(image_load_result.error()) << '\n';
		return 1;
	}

	cv::Mat processed = scanner::processing::preprocess(*image_load_result);

	if (show) {
		cv::namedWindow("Result", cv::WINDOW_NORMAL);
		cv::imshow("Result", processed);
		cv::waitKey(0);
	}

	scanner::ocr::Engine ocr_engine(argv[0]);
	auto ocr_result = ocr_engine.recognize(processed);
	if (!ocr_result) {
		std::cerr << "ERROR: " << scanner::ocr::error_to_string(ocr_result.error()) << '\n';
		return 1;
	}



	std::cout << *ocr_result << '\n';

	return 0;
}
