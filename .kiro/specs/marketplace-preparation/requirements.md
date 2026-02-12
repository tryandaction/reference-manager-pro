# Requirements Document

## Introduction

本文档定义了 Reference Manager Pro 插件发布到 VS Code Marketplace 前的准备工作需求。该插件是一个 LaTeX 文献管理工具，核心功能已完成（AI 格式化、未使用引用检测、智能去重），商业化功能已实现（License 系统、免费/付费版本），所有测试通过（105 个测试）。

发布前准备工作旨在提升插件的市场吸引力、用户体验和专业形象，包括视觉资产创建、文档完善、用户引导和错误处理优化。

## Glossary

- **Extension**: VS Code 插件，本文档中特指 Reference Manager Pro
- **Marketplace**: VS Code Marketplace，微软官方的插件市场
- **Icon**: 插件图标，显示在 Marketplace 和 VS Code 插件列表中
- **Demo_GIF**: 演示动画，展示插件核心功能的 GIF 图片
- **Package_Manifest**: package.json 文件，包含插件的元数据和配置
- **Welcome_Page**: 欢迎页面，用户首次安装插件后显示的引导页面
- **Webview**: VS Code 的 Web 视图 API，用于在编辑器中显示 HTML 内容
- **Error_Message**: 错误提示信息，向用户显示的错误说明和解决方案
- **Gallery_Banner**: Marketplace 画廊横幅，插件详情页顶部的背景色配置
- **Badge**: 徽章，显示在 README 中的状态图标（如版本号、下载量等）
- **Global_State**: VS Code 的全局状态存储，用于跨会话保存数据
- **BibTeX**: LaTeX 文献引用格式
- **API_Key**: API 密钥，用于访问 AI 服务（Groq 或 Anthropic）

## Requirements

### Requirement 1: 创建插件图标

**User Story:** 作为插件开发者，我需要创建专业的插件图标，以便在 Marketplace 和 VS Code 中提升品牌识别度和专业形象。

#### Acceptance Criteria

1. THE Icon SHALL be in SVG format with dimensions of 128x128 pixels
2. THE Icon SHALL include design elements representing books, citation symbols, or AI elements
3. THE Icon SHALL use professional academic color scheme (blue or dark tones)
4. THE Icon SHALL be clearly visible on both light and dark backgrounds
5. THE Icon SHALL be saved to the images directory as icon.svg
6. WHERE a PNG version is needed, THE System SHALL provide conversion instructions or tools

### Requirement 2: 录制演示动画

**User Story:** 作为潜在用户，我想看到插件功能的演示动画，以便快速了解插件能做什么以及如何使用。

#### Acceptance Criteria

1. THE Demo_GIF SHALL demonstrate 3-5 core features of the extension
2. WHEN demonstrating AI formatting, THE Demo_GIF SHALL show before and after states of BibTeX entries
3. WHEN demonstrating unused citation detection, THE Demo_GIF SHALL show the detection process and results
4. WHEN demonstrating duplicate removal, THE Demo_GIF SHALL show the identification and removal process
5. THE Demo_GIF SHALL be optimized for file size (under 5MB per GIF)
6. THE Demo_GIF SHALL be saved to the images directory with descriptive filenames
7. THE Demo_GIF SHALL be referenced in README.md with appropriate Markdown syntax

### Requirement 3: 完善 Package Manifest

**User Story:** 作为插件开发者，我需要完善 package.json 配置，以便在 Marketplace 上提供完整的插件信息和优化搜索排名。

#### Acceptance Criteria

1. THE Package_Manifest SHALL include an icon field pointing to the correct icon path
2. THE Package_Manifest SHALL include galleryBanner configuration with appropriate theme and color
3. THE Package_Manifest SHALL include badges for GitHub stars, downloads, and version
4. THE Package_Manifest SHALL include at least 15 relevant keywords for search optimization
5. THE Package_Manifest SHALL include homepage URL pointing to the project documentation
6. THE Package_Manifest SHALL include bugs URL pointing to GitHub Issues
7. THE Package_Manifest SHALL have repository.url set to https://github.com/tryandaction/reference-manager-pro
8. THE Package_Manifest SHALL include categories that accurately describe the extension functionality

### Requirement 4: 创建欢迎页面

**User Story:** 作为新用户，我想在首次安装插件后看到欢迎页面，以便快速了解如何配置和使用插件。

#### Acceptance Criteria

1. WHEN the extension is installed for the first time, THE Welcome_Page SHALL be displayed automatically
2. THE Welcome_Page SHALL include a welcome title and subtitle
3. THE Welcome_Page SHALL provide 3-5 quick start steps
4. THE Welcome_Page SHALL include guidance for configuring Groq API Key
5. THE Welcome_Page SHALL display feature introduction cards for core functionalities
6. THE Welcome_Page SHALL include links to FAQ and documentation
7. THE Welcome_Page SHALL use VS Code theme colors for consistent styling
8. THE Welcome_Page SHALL be responsive and display correctly on different window sizes
9. WHEN the user closes the welcome page, THE System SHALL store this state in Global_State
10. WHEN the welcome page has been shown once, THE System SHALL NOT display it again on subsequent activations
11. THE Extension SHALL provide a command to manually show the welcome page again
12. THE Welcome_Page SHALL be implemented using VS Code Webview API

### Requirement 5: 改进错误提示

**User Story:** 作为用户，我想看到友好且可操作的错误提示，以便快速理解问题并找到解决方案。

#### Acceptance Criteria

1. THE Error_Message SHALL be displayed in bilingual format (Chinese primary, English in parentheses)
2. WHEN an API key is invalid, THE Error_Message SHALL provide specific troubleshooting steps
3. WHEN an API error occurs, THE Error_Message SHALL include detailed diagnostic information
4. THE Error_Message SHALL include clickable action buttons (e.g., "Open Settings", "View Help")
5. WHEN a common error occurs, THE Error_Message SHALL suggest specific solutions
6. THE Error_Message SHALL link to relevant documentation or help pages
7. WHEN an API request fails, THE Error_Message SHALL distinguish between network errors, authentication errors, and service errors
8. THE Error_Message SHALL avoid technical jargon and use user-friendly language
9. WHEN displaying error messages, THE System SHALL log detailed error information for debugging purposes
10. THE Error_Message SHALL be consistent across all extension commands and features

### Requirement 6: 文档集成

**User Story:** 作为用户，我需要在 README 中看到完整的插件信息，以便在 Marketplace 上做出安装决策。

#### Acceptance Criteria

1. THE README SHALL include the plugin icon at the top
2. THE README SHALL include badges for version, downloads, and ratings
3. THE README SHALL include demo GIFs for each major feature
4. THE README SHALL reference the welcome page functionality
5. THE README SHALL document the improved error message system
6. THE README SHALL include a "Features" section highlighting all capabilities
7. THE README SHALL include a "Getting Started" section with setup instructions
8. THE README SHALL include a "Requirements" section listing prerequisites

### Requirement 7: 资源文件管理

**User Story:** 作为开发者，我需要正确组织和引用资源文件，以便插件打包和发布时包含所有必要的资产。

#### Acceptance Criteria

1. THE System SHALL create an images directory if it does not exist
2. THE System SHALL store all icon files in the images directory
3. THE System SHALL store all demo GIF files in the images directory
4. THE Package_Manifest SHALL reference icon files using relative paths
5. THE README SHALL reference demo GIF files using relative paths
6. THE .vscodeignore file SHALL NOT exclude the images directory
7. WHEN packaging the extension, THE System SHALL include all files in the images directory

### Requirement 8: 欢迎页面样式

**User Story:** 作为用户，我希望欢迎页面的视觉风格与 VS Code 一致，以便获得原生的使用体验。

#### Acceptance Criteria

1. THE Welcome_Page SHALL use VS Code CSS variables for colors (e.g., --vscode-foreground, --vscode-background)
2. THE Welcome_Page SHALL adapt to both light and dark themes automatically
3. THE Welcome_Page SHALL use VS Code's default font family
4. THE Welcome_Page SHALL include appropriate spacing and padding for readability
5. THE Welcome_Page SHALL use VS Code button styles for action buttons
6. THE Welcome_Page SHALL include hover effects consistent with VS Code UI patterns
7. THE Welcome_Page SHALL be accessible and support keyboard navigation

### Requirement 9: 错误处理覆盖

**User Story:** 作为开发者，我需要确保所有可能的错误场景都有友好的提示，以便提升用户体验和减少支持请求。

#### Acceptance Criteria

1. WHEN the Groq API key is missing, THE System SHALL display a setup guide error message
2. WHEN the Anthropic API key is missing and Anthropic is selected, THE System SHALL display a setup guide error message
3. WHEN an API request times out, THE System SHALL display a timeout error with retry suggestion
4. WHEN an API returns a rate limit error, THE System SHALL display a rate limit message with wait time
5. WHEN a BibTeX file cannot be parsed, THE System SHALL display a parsing error with line number
6. WHEN no BibTeX entries are selected, THE System SHALL display a selection prompt
7. WHEN the license key is invalid, THE System SHALL display a license error with purchase link
8. WHEN a network error occurs, THE System SHALL display a connectivity error with troubleshooting steps

### Requirement 10: 欢迎页面内容

**User Story:** 作为新用户，我需要在欢迎页面上看到清晰的功能介绍和配置指导，以便快速开始使用插件。

#### Acceptance Criteria

1. THE Welcome_Page SHALL include a hero section with extension name and tagline
2. THE Welcome_Page SHALL list all core features with brief descriptions
3. THE Welcome_Page SHALL provide step-by-step API key configuration instructions
4. THE Welcome_Page SHALL include visual icons or illustrations for each feature
5. THE Welcome_Page SHALL include a "Get Started" call-to-action button
6. THE Welcome_Page SHALL include links to documentation, GitHub, and support
7. THE Welcome_Page SHALL mention both free and Pro features
8. THE Welcome_Page SHALL include a "Don't show again" checkbox option
