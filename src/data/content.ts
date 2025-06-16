// Newline marker for content formatting
export const NEWLINE = '||NEWLINE||';

// Helper function to process text with newline markers
export const processText = (text: string): string[] => {
  return text.split(NEWLINE);
};

export const aboutContent = {
  name: "Jason Lai",
  title: "Software Engineer",
  description: `Hi, I'm Jason, a junior at Georgia Tech studying Computer Science. ${NEWLINE} I'm a passionate engineer with experience in full-stack development, and I enjoy working with modern technologies to build user-focused, data-driven applications.${NEWLINE}I'm currently exploring data engineering, machine learning, and AI. ${NEWLINE} Reach out to me @ jlai80 [at] gatech [dot] edu`
};

export const educationData = [
  {
    institution: "Georgia Institute of Technology",
    degree: "Bachelor of Science in Computer Science",
    period: "2023 - 2026",
    description: `GPA: 3.91/4.00. ${NEWLINE} Minor in Mathematics. ${NEWLINE} Concentrations in Information Internetworks and Artifical Intelligence.`
  }
];

export const workExperienceData = [
  {
    company: "Amazon",
    position: "Software Development Engineer Intern",
    period: "May 2025 - Present",
    description: "Developed an end to end testing platform for Amazon's internal delivery tracking system using native AWS services."
  },
  {
    company: "Smurfit Westrock",
    position: "Software & IT Intern",
    period: "May 2024 - August 2024",
    description: "Developed data pipelines for Qlik BI dashboard using Python. Harnessed LLMs for automated proposal auditing."
  },
  {
    company: "Georgia State University",
    position: "Machine Learning Research Assistant",
    period: "August 2022 - May 2023",
    description: "Data analysis and validation for novel sentiment analysis and adversarial attack prevention models."
  }
];

export const projectsData = [
  {
    title: "FoundIt",
    description: "A collaborative task management tool built with React, Express, and MongoDB. Features real-time updates and team collaboration.",
    technologies: ["React", "Node.js", "MongoDB", "Socket.io"],
    link: "https://github.com/jasonlai"
  },
  {
    title: "WebGPU Fire Simulator",
    description: "Data visualization dashboard for e-commerce metrics using D3.js and Python backend with machine learning predictions.",
    technologies: ["Python", "D3.js", "PostgreSQL", "scikit-learn"],
    link: "https://github.com/jasonlai"
  },
  {
    title: "Semantic Segmentation Implementation",
    description: "React Native app for fitness tracking with GPS integration and social features.",
    technologies: ["React Native", "Firebase", "Google Maps API"],
    link: "https://github.com/jasonlai"
  },
  {
    title: "Scene Recognition (ResNet Implementation)",
    description: "Data visualization dashboard for e-commerce metrics using D3.js and Python backend with machine learning predictions.",
    technologies: ["Python", "D3.js", "PostgreSQL", "scikit-learn"],
    link: "https://github.com/jasonlai"
  },
  {
    title: "Image Stitching with SIFT Features",
    description: "Data visualization dashboard for e-commerce metrics using D3.js and Python backend with machine learning predictions.",
    technologies: ["Python", "D3.js", "PostgreSQL", "scikit-learn"],
    link: "https://github.com/jasonlai"
  },
  {
    title: "NN, Random Forest, PCA, Logistic Regression, GMM, K-means Implementations",
    description: "Data visualization dashboard for e-commerce metrics using D3.js and Python backend with machine learning predictions.",
    technologies: ["Python", "D3.js", "PostgreSQL", "scikit-learn"],
    link: "https://github.com/jasonlai"
  },
  {
    title: "Reliable Transport Protocol",
    description: "Data visualization dashboard for e-commerce metrics using D3.js and Python backend with machine learning predictions.",
    technologies: ["Python", "D3.js", "PostgreSQL", "scikit-learn"],
    link: "https://github.com/jasonlai"
  },
  {
    title: "Process Scheduling Simulator",
    description: "Data visualization dashboard for e-commerce metrics using D3.js and Python backend with machine learning predictions.",
    technologies: ["Python", "D3.js", "PostgreSQL", "scikit-learn"],
    link: "https://github.com/jasonlai"
  },
  {
    title: "Virtual Memory Simulator",
    description: "Data visualization dashboard for e-commerce metrics using D3.js and Python backend with machine learning predictions.",
    technologies: ["Python", "D3.js", "PostgreSQL", "scikit-learn"],
    link: "https://github.com/jasonlai"
  },
  {
    title: "Functional Datapath for LC2200",
    description: "Data visualization dashboard for e-commerce metrics using D3.js and Python backend with machine learning predictions.",
    technologies: ["Python", "D3.js", "PostgreSQL", "scikit-learn"],
    link: "https://github.com/jasonlai"
  },
  {
    title: "Delivery Drone Database",
    description: "Data visualization dashboard for e-commerce metrics using D3.js and Python backend with machine learning predictions.",
    technologies: ["Python", "D3.js", "PostgreSQL", "scikit-learn"],
    link: "https://github.com/jasonlai"
  },
  {
    title: "Green Plate",
    description: "Data visualization dashboard for e-commerce metrics using D3.js and Python backend with machine learning predictions.",
    technologies: ["Python", "D3.js", "PostgreSQL", "scikit-learn"],
    link: "https://github.com/jasonlai"
  },
  {
    title: "Social Cookbook",
    description: "Data visualization dashboard for e-commerce metrics using D3.js and Python backend with machine learning predictions.",
    technologies: ["Python", "D3.js", "PostgreSQL", "scikit-learn"],
    link: "https://github.com/jasonlai"
  },
  {
    title: "Ranged Noise Cancellation Device",
    description: "Data visualization dashboard for e-commerce metrics using D3.js and Python backend with machine learning predictions.",
    technologies: ["Python", "D3.js", "PostgreSQL", "scikit-learn"],
    link: "https://github.com/jasonlai"
  },
];

export const albumsData = [
  {
    title: "Luv is Rage",
    artist: "Lil Uzi Vert",
    image: "https://i.scdn.co/image/ab67616d0000b2736b9e2cd3c76bc7e3c1c52f95?w=300&h=300&fit=crop"
  },
  {
    title: "Graduation",
    artist: "Kanye West",
    image: "https://i.scdn.co/image/ab67616d0000b2739bbd79106e510d13a9a5ec33?w=300&h=300&fit=crop"
  },
  {
    title: "Ctrl",
    artist: "Sza",
    image: "https://i.scdn.co/image/ab67616d0000b2734c79d5ec52a6d0302f3add25?w=300&h=300&fit=crop"
  },
  {
    title: "Blond",
    artist: "Frank Ocean",
    image: "https://i.scdn.co/image/ab67616d0000b273c5649add07ed3720be9d5526?w=300&h=300&fit=crop"
  },
  {
    title: "Rodeo",
    artist: "Travis Scott",
    image: "https://i.scdn.co/image/ab67616d0000b2736cfd9a7353f98f5165ea6160?w=300&h=300&fit=crop"
  },
  {
    title: "Eternal Atake",
    artist: "Lil Uzi Vert",
    image: "https://i.scdn.co/image/ab67616d0000b273158b08c02c249bc651b3b47a?w=300&h=300&fit=crop"
  },
  {
    title: "Honestly, Nevermind",
    artist: "Drake",
    image: "https://i.scdn.co/image/ab67616d0000b2738dc0d801766a5aa6a33cbe37?w=300&h=300&fit=crop"
  },
  {
    title: "My Beautiful Dark Twisted Fantasy",
    artist: "Kanye West",
    image: "https://i.scdn.co/image/ab67616d0000b273d9194aa18fa4c9362b47464f?w=300&h=300&fit=crop"
  },
  {
    title: "Take Care",
    artist: "Drake",
    image: "https://i.scdn.co/image/ab67616d0000b273ac0c2daf1867b0d86cca74be?w=300&h=300&fit=crop"
  },
  {
    title: "Channel Orange",
    artist: "Frank Ocean",
    image: "https://i.scdn.co/image/ab67616d0000b2737aede4855f6d0d738012e2e5?w=300&h=300&fit=crop"
  },
  {
    title: "LIVE.LOVE.A$AP",
    artist: "A$AP Rocky",
    image: "https://i.scdn.co/image/ab67616d00001e02c8ced8a4d6b6b61eb592f3dd?w=300&h=300&fit=crop"
  },
  {
    title: "Camp",
    artist: "Childish Gambino",
    image: "https://i.scdn.co/image/ab67616d0000b2736f134f8d843353be21a9706e?w=300&h=300&fit=crop"
  },
];

export const booksData = [
  {
    title: "The 48 Laws of Power",
    author: "Robert Greene",
    image: "https://i.scdn.co/image/ab676663000022a8774c09f1f8a4c97ad6cbcaf7?w=300&h=400&fit=crop"
  },
  {
    title: "Thank You for Arguing",
    author: "Jay Heinrichs",
    image: "https://m.media-amazon.com/images/I/61JLR+MlfiL._UF1000,1000_QL80_.jpg?w=300&h=400&fit=crop"
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    image: "https://m.media-amazon.com/images/I/81TLiZrasVL._UF1000,1000_QL80_.jpg?w=300&h=400&fit=crop"
  },
  {
    title: "The Things They Carried",
    author: "Tim O'Brien",
    image: "https://m.media-amazon.com/images/I/71boO2LKbCL.jpg?w=300&h=400&fit=crop"
  },
  {
    title: "Farenheit 451",
    author: "Ray Bradbury",
    image: "https://m.media-amazon.com/images/I/61sKsbPb5GL._UF1000,1000_QL80_.jpg?w=300&h=400&fit=crop"
  },
  {
    title: "Lord of the Flies",
    author: "William Golding",
    image: "https://m.media-amazon.com/images/I/81t-Qi4X6HL._UF1000,1000_QL80_.jpg?w=300&h=400&fit=crop"
  },
  
];