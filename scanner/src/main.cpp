#include "image/loader.hpp"
#include "processing/processing.hpp"

#include <CLI/CLI.hpp>

int main(int argc, char* argv[]) {
	CLI::App app("Scanner - OCR Engine");

	std::string image_path;
	app.add_option("image", image_path, "Path to image")
		->required()
		->check(CLI::ExistingFile);

	CLI11_PARSE(app, argc, argv);

	auto load_result = scanner::image::from_path(image_path);
	if (!load_result) {
		std::cerr << "ERROR: " << scanner::image::error_to_string(load_result.error()) << '\n';
		return -1;
	}

	cv::Mat grayscaled = scanner::processing::grayscale(*load_result);

	cv::imshow("Original", *load_result);
	cv::imshow("Grayscale", grayscaled);
	cv::waitKey(0);

	return 0;
}
