import Navigation from "../components/Navigation";
import SocialLinks from "../components/SocialLinks";
import { educationData, workExperienceData, projectsData, processText } from "../data/content";

const Work = () => {
  return (
    <div className="min-h-screen bg-background pb-16">
      <Navigation />
      <SocialLinks />
      
      <div className="pt-20 px-6 h-screen">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Left Column - Education and Work Experience */}
            <div className="space-y-8 overflow-y-auto pr-4">
              {/* Education Section */}
              <section>
                <h2 className="text-2xl font-bold mb-6 text-foreground">Education</h2>
                <div className="space-y-4">
                  {educationData.map((edu, index) => {
                    const descriptionParagraphs = processText(edu.description);
                    return (
                      <div key={index} className="border-l-2 border-primary/40 pl-4">
                        <h3 className="font-semibold text-foreground">{edu.degree}</h3>
                        <p className="text-primary font-medium">{edu.institution}</p>
                        <p className="text-sm text-muted-foreground mb-2">{edu.period}</p>
                        <div className="text-sm text-foreground space-y-1">
                          {descriptionParagraphs.map((paragraph, pIndex) => (
                            <p key={pIndex}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Work Experience Section */}
              <section>
                <h2 className="text-2xl font-bold mb-6 text-foreground">Work Experience</h2>
                <div className="space-y-6">
                  {workExperienceData.map((work, index) => (
                    <div key={index} className="border-l-2 border-primary/40 pl-4">
                      <h3 className="font-semibold text-foreground">{work.position}</h3>
                      <p className="text-primary font-medium">{work.company}</p>
                      <p className="text-sm text-muted-foreground mb-2">{work.period}</p>
                      <p className="text-sm text-foreground">{work.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column - Projects */}
            <div className="overflow-y-auto pl-4">
              <section>
                <h2 className="text-2xl font-bold mb-6 text-foreground">Projects</h2>
                <div className="space-y-6">
                  {projectsData.map((project, index) => (
                    <div key={index} className="border border-foreground/15 rounded-lg p-6 hover:border-primary/40 transition-colors">
                      <h3 className="font-semibold text-foreground mb-2">{project.title}</h3>
                      <p className="text-sm text-foreground mb-3">{project.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.technologies.map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        View Project →
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Work;