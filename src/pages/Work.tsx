import Navigation from "../components/Navigation";
import SocialLinks from "../components/SocialLinks";
import { educationData, workExperienceData, projectsData, processText } from "../data/content";

const Work = () => {
  return (
    <div className="min-h-screen bg-[hsl(50_5%_90%)] dark:bg-[hsl(180_5%_10%)] pb-16">
      <Navigation />
      <SocialLinks />
      
      {/* Mobile: Single column layout */}
      <div className="pt-20 px-6 lg:hidden">
        <div className="max-w-4xl mx-auto space-y-12">
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
              {workExperienceData.map((work, index) => {
                const descriptionParagraphs = processText(work.description);
                return (
                  <div key={index} className="border-l-2 border-primary/40 pl-4">
                  <h3 className="font-semibold text-foreground">{work.position}</h3>
                  <p className="text-primary font-medium">{work.company}</p>
                  <p className="text-sm text-muted-foreground mb-2">{work.period}</p>
                  <p className="text-sm text-foreground">{
                    descriptionParagraphs.map((paragraph, pIndex) => (
                      <p key={pIndex}>{paragraph}</p>
                    ))}</p>
                </div>
                );
              })}
            </div>
          </section>

          {/* Projects Section */}
          <section>
            <h2 className="text-2xl font-bold mb-6 text-foreground">Projects</h2>
            <div className="space-y-6">
              {projectsData.map((project, index) => {
                const descriptionParagraphs = processText(project.description);
                return (
                  <div key={index} className="border border-foreground/15 rounded-lg p-6 hover:border-primary/40 transition-colors">
                    <h3 className="font-semibold text-foreground mb-2">{project.title}</h3>
                    <p className="text-sm text-foreground mb-3">{
                      descriptionParagraphs.map((paragraph, pIndex) => (
                        <p key={pIndex}>{paragraph}</p>
                      ))}
                    </p>
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
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        View Project →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Desktop: Two column layout with independent scrolling */}
      <div className="hidden lg:block pt-20 px-6 xl:px-8 2xl:px-12 h-screen">
        <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto h-full">
          <div className="grid grid-cols-2 gap-8 xl:gap-12 2xl:gap-16 h-full">
            {/* Left Column - Education and Work Experience */}
            <div className="space-y-6 xl:space-y-8 2xl:space-y-10 overflow-y-auto pr-4">
              {/* Education Section */}
              <section>
                <h2 className="text-xl xl:text-2xl 2xl:text-3xl font-bold mb-4 xl:mb-6 text-foreground">Education</h2>
                <div className="space-y-3 xl:space-y-4">
                  {educationData.map((edu, index) => {
                    const descriptionParagraphs = processText(edu.description);
                    return (
                      <div key={index} className="border-l-2 border-primary/40 pl-3 xl:pl-4">
                        <h3 className="font-semibold text-foreground text-sm xl:text-base 2xl:text-lg">{edu.degree}</h3>
                        <p className="text-primary font-medium text-sm xl:text-sm 2xl:text-base">{edu.institution}</p>
                        <p className="text-xs xl:text-xs 2xl:text-sm text-muted-foreground mb-2">{edu.period}</p>
                        <div className="text-sm xl:text-sm 2xl:text-base text-foreground space-y-1">
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
                <h2 className="text-xl xl:text-2xl 2xl:text-3xl font-bold mb-4 xl:mb-6 text-foreground">Work Experience</h2>
                <div className="space-y-4 xl:space-y-6">
                  {workExperienceData.map((work, index) => {
                    const descriptionParagraphs = processText(work.description);
                    return (
                      <div key={index} className="border-l-2 border-primary/40 pl-3 xl:pl-4">
                        <h3 className="font-semibold text-foreground text-sm xl:text-base 2xl:text-lg">{work.position}</h3>
                        <p className="text-primary font-medium text-sm xl:text-sm 2xl:text-base">{work.company}</p>
                        <p className="text-xs xl:text-xs 2xl:text-sm text-muted-foreground mb-2">{work.period}</p>
                        <p className="text-sm xl:text-sm 2xl:text-base text-foreground">{
                          descriptionParagraphs.map((paragraph, pIndex) => (
                            <p key={pIndex}>{paragraph}</p>
                          ))}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Right Column - Projects */}
            <div className="overflow-y-auto pl-4">
              <section>
                <h2 className="text-xl xl:text-2xl 2xl:text-3xl font-bold mb-4 xl:mb-6 text-foreground">Projects</h2>
                <div className="space-y-4 xl:space-y-6">
                  {projectsData.map((project, index) => {
                    const descriptionParagraphs = processText(project.description);
                    return (
                      <div key={index} className="border border-foreground/15 rounded-lg p-4 xl:p-6 2xl:p-8 hover:border-primary/40 transition-colors">
                        <h3 className="font-semibold text-foreground mb-2 text-sm xl:text-base 2xl:text-lg">{project.title}</h3>
                        <p className="text-sm xl:text-sm 2xl:text-base text-foreground mb-2 xl:mb-3">{
                          descriptionParagraphs.map((paragraph, pIndex) => (
                            <p key={pIndex}>{paragraph}</p>
                          ))}
                        </p>
                        <div className="flex flex-wrap gap-1 xl:gap-2 mb-2 xl:mb-3">
                          {project.technologies.map((tech, techIndex) => (
                            <span
                              key={techIndex}
                              className="px-2 py-1 xl:px-2 xl:py-1 bg-accent text-accent-foreground text-xs xl:text-xs 2xl:text-sm rounded"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-xs xl:text-xs 2xl:text-sm"
                          >
                            View Project →
                          </a>
                        )}
                      </div>
                    );
                  })}
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