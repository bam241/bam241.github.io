module Jekyll
    class AuthorDataGenerator < Generator
      def generate(site)
        # Load author data
        author = site.data['author']
        
        # Set site configuration from author data
        site.config['title'] = author['name']
        site.config['tagline'] = author['title']
        site.config['description'] = author['description']
        
        # Set author configuration
        site.config['author'] = {
          'name' => author['name'],
          'title' => author['title'],
          'description' => author['description'],
          'email' => author['email'],
          'github' => author['github'],
          'linkedin' => author['linkedin']
        }
        
        # Set GitHub configuration
        site.config['github'] = { 'username' => author['github'] }
        
        # Set social configuration
        site.config['social'] = {
          'name' => author['name'],
          'email' => author['email'],
          'links' => [
            "https://github.com/#{author['github']}",
            "https://www.linkedin.com/in/#{author['linkedin']}"
          ]
        }
      end
    end
  end