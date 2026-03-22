#include "loader.hpp"
#include <filesystem>

namespace scanner::image {
    std::string error_to_string(LoadError err) {
        switch (err) {
            case LoadError::FileNotFound: return "File not found";
            case LoadError::ImageEmpty: return "OpenCV: Image empty";
        }

        return "Undefined error";
    }

    std::expected<cv::Mat, LoadError> from_path(const std::string& path) {
        if (!std::filesystem::exists(path))
            return std::unexpected(LoadError::FileNotFound);

        cv::Mat image = cv::imread(path);
        if (image.empty())
            return std::unexpected(LoadError::ImageEmpty);

        return image;
    }
}