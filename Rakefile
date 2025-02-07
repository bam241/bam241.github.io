namespace :js do
    desc "Build JavaScript files"
    task :build do
      puts "Building JavaScript files..."
      
      # Ensure output directory exists
      FileUtils.mkdir_p('assets/js')
      
      # Define source files in order of dependency
      js_files = [
        '_javascript/timeline/managers/ColorManager.js',
        '_javascript/timeline/managers/FilterManager.js',
        '_javascript/timeline/managers/ProjectPositioner.js',
        '_javascript/timeline/managers/ZoomManager.js',
        '_javascript/timeline/utils/DOMutils.js',
        '_javascript/timeline/TimelineManager.js',
        '_javascript/timeline/main.js'
      ]
      
      # Combine files
      combined = js_files.map do |file|
        content = File.read(file)
        "// Source: #{file}\n#{content}\n"
      end.join("\n")
      
      # Write combined file
      File.write('assets/js/timeline.js', combined)
      
      puts "JavaScript build complete!"
    end
  end