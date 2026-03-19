namespace :js do
    desc "Build JavaScript files"
    task :build do
      puts "Building JavaScript files..."

      FileUtils.mkdir_p('assets/js')

      js_files = [
        '_javascript/timeline/managers/ColorManager.js',
        '_javascript/timeline/managers/FilterManager.js',
        '_javascript/timeline/managers/ProjectPositioner.js',
        '_javascript/timeline/managers/ZoomManager.js',
        '_javascript/timeline/utils/DOMUtils.js',       # ← fixed: uppercase U
        '_javascript/timeline/TimeLineManager.js',       # ← fixed: uppercase L
        '_javascript/timeline/main.js'
      ]

      combined = js_files.map do |file|
        content = File.read(file)
        "// Source: #{file}\n#{content}\n"
      end.join("\n")

      File.write('assets/js/timeline.js', combined)

      puts "JavaScript build complete!"
    end
  end