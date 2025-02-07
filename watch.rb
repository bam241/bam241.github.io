require 'filewatcher'

Filewatcher.new(['_javascript/**/*.js']).watch do |filename, event|
  if event == :changed
    puts "Detected change in #{filename}"
    system('rake js:build')
  end
end