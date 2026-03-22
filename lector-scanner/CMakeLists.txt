cmake_minimum_required(VERSION 3.15)

project("scanner" VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Hot Reload for MSVC
if (POLICY CMP0141)
  cmake_policy(SET CMP0141 NEW)
  set(CMAKE_MSVC_DEBUG_INFORMATION_FORMAT "$<IF:$<AND:$<C_COMPILER_ID:MSVC>,$<CXX_COMPILER_ID:MSVC>>,$<$<CONFIG:Debug,RelWithDebInfo>:EditAndContinue>,$<$<CONFIG:Debug,RelWithDebInfo>:ProgramDatabase>>")
endif()

find_package(OpenCV REQUIRED)
find_package(Tesseract CONFIG REQUIRED)
find_package(CLI11 REQUIRED)

add_executable(scanner 
	"src/main.cpp"  
	"src/image/loader.cpp" 
	"src/processing/processing.cpp"
 "src/ocr/engine.cpp")
target_include_directories(scanner PRIVATE src)
target_link_libraries(scanner PRIVATE
	opencv_core
	opencv_imgproc
	opencv_imgcodecs
    opencv_highgui
	Tesseract::libtesseract
	CLI11::CLI11
)

# copy assets/ content to build
add_custom_command(TARGET scanner POST_BUILD
	COMMAND ${CMAKE_COMMAND} -E copy_directory
	${CMAKE_SOURCE_DIR}/assets
	$<TARGET_FILE_DIR:scanner>
)