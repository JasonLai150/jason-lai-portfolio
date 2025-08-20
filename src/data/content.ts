// Newline marker for content formatting
export const NEWLINE = '||NEWLINE||';

// Helper function to process text with newline markers
export const processText = (text: string): string[] => {
  return text.split(NEWLINE);
};

export const aboutContent = {
  name: "Jason Lai",
  title: "Software Engineer",
  description: `Hi, I'm Jason, a junior at Georgia Tech studying Computer Science. ${NEWLINE} I'm a passionate engineer with experience in full-stack development, and I enjoy working with modern technologies to build user-focused, data-driven applications.${NEWLINE}I'm currently exploring machine learning, data engineering, and AI. ${NEWLINE}⠀${NEWLINE} Reach out to me at: ${NEWLINE} laijason150[@]gmail[.]com`
};

export const educationData = [
  {
    institution: "Georgia Institute of Technology",
    degree: "Bachelor of Science in Computer Science",
    period: "2023 - 2027",
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
    description: "Created an LLM-based web audit tool for analyzing and spotting quality issues in IT project proposals."
  },
  {
    company: "Georgia State University",
    position: "Machine Learning Research Assistant",
    period: "August 2022 - May 2023",
    description: "Data testing and validation for novel sentiment analysis and adversarial attack prevention models."
  }
];

export const projectsData = [
  {
    title: "GT-GPT",
    description: `In progress... ${NEWLINE} RAG tool for finding information from Georgia Tech's impossible-to-navigate webpages`,
    technologies: ["LangChain", "ChromaDB", "RAG", "Scrapy", "BeautifulSoup", "Python"],
    link: "https://github.com/JasonLai150/GT-GPT-Tools"
  },
  {
    title: "FoundIt",
    description: "Match-based networking app for connecting founders, developers, and investors.",
    technologies: ["React Native", "TypeScript", "Node.js", "Supabase", "Expo"],
    link: "https://github.com/JasonLai150/FoundIt"
  },
  {
    title: "WebGPU Fire Simulator",
    description: "Real-time physically accurate fire simulator built with WebGPU in WGSL.",
    technologies: ["WebGPU", "WGSL", "JavaScript"],
    link: "https://github.com/JasonLai150/stablefluidsflame"
  },
  {
    title: "Personal Portfolio Website",
    description: "This!",
    technologies: ["React", "Tailwind CSS", "Typescript", "Supabase"],
    link: "https://github.com/JasonLai150/jason-lai-portfolio"
  },
  {
    title: "Green Plate",
    description: "Nutrition tracking and meal planning app powered by user-generated recipes.",
    technologies: ["Android Studio", "Java", "JUnit", "Gradle", "Firebase"],
    link: "https://github.com/JasonLai150/GreenPlate"
  },
  {
    title: "Social Cookbook",
    description: "Social app for viewing food content, connecting with users, and sharing and discovering recipes.",
    technologies: ["React", "Node.js", "Express", "MongoDB", "Firebase"],
    link: "https://github.com/Social-Cookbook"
  },
  {
    title: "Predicting Student Stress",
    description: "Modeling and predicting stress levels in students based on over 20 features that were further processed with PCA. Modeled with Neural Networks, SVMs, and Decision Trees. CS4641.",
    technologies: ["Pytorch", "Python", "Pandas", "matplotlib", "scikit-learn"],
    link: "https://studentstress.streamlit.app/"
  },
  {
    title: "Ranged Noise Cancellation Device",
    description: "Functional noise cancellation device with a microphone and speaker. Presented at 2023 IEEE ISEC conference.",
    technologies: ["Arduino", "C", "Circuit Design"],
    link: "https://ieeexplore.ieee.org/document/10025054"
  },
  {
    title: "Semantic Segmentation Implementation",
    description: "11-class semantic segmentation model using PPM and implemented with PSPNet. CS4476.",
    technologies: ["Pytorch", "Jupyter Notebook", "Python"],
  },
  {
    title: "Scene Recognition Model",
    description: "Trained custom CNN and finetuned ResNet-18 model for 15-class scene recognition. CS4476.",
    technologies: ["Pytorch", "Jupyter Notebook", "Python"],
  },
  {
    title: "Panorama Image Stitching with SIFT Features",
    description: "Harris corner point feature detection, SIFT feature descriptors, NNDR feature matching, homography estimation, and image stitching. CS4476.",
    technologies: ["PyTorch","Python", "Jupyter Notebook", "OpenCV"],
  },
  {
    title: "NN, Random Forest, PCA, Logistic Regression, GMM, K-means Implementations",
    description: "Implementations of various machine learning algorithms. CS4641.",
    technologies: ["Pytorch", "Python", "Pandas", "matplotlib", "scikit-learn"],
  },
  {
    title: "Reliable Transport Protocol",
    description: "Reliable transport protocol implementation including packetizing, checksum, and retransmission. CS2200.",
    technologies: ["C"],
  },
  {
    title: "Process Scheduling Simulator",
    description: "Simulated FCFS, Round Robin, SRTF, and Priority Scheduling with thread-safe operation. CS2200.",
    technologies: ["C"],
  },
  {
    title: "Virtual Memory Simulator",
    description: "Virtual memory simulation complete with address splitting, free-frame tracking, context switching, and clock-sweep and LRU eviction methods. CS2200.",
    technologies: ["C"],
  },
  {
    title: "Functional Datapath for LC2200",
    description: "Functional LC2200 datapath with interrupts built with fundamental components in CircuitSim. Complete with microcode for the FSM and op-code definitions. CS2200.",
    technologies: ["CircuitSim"],
  },
  {
    title: "Delivery Drone Database",
    description: "Relational database for delivery drones with CRUD operations.",
    technologies: ["MySQL", "Sequelize"],
  },

];

export const albumsData = [
  {
    title: "nolimit",
    artist: "Knock2",
    image: "https://i.scdn.co/image/ab67616d0000b2737b3e13a4e21a128c0d04c789?w=300&h=300&fit=crop"
  },
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
    title: "18 Months",
    artist: "Calvin Harris",
    image: "https://i.scdn.co/image/ab67616d0000b273dcef905cb144d4867119850b?w=300&h=300&fit=crop"
  },
  {
    title: "Camp",
    artist: "Childish Gambino",
    image: "https://i.scdn.co/image/ab67616d0000b2736f134f8d843353be21a9706e?w=300&h=300&fit=crop"
  },
];

export const booksData = [
  {
    title: "Meditations, The Annotated Edition",
    author: "Marcus Aurelius, Robin Waterfield",
    image: "https://m.media-amazon.com/images/I/811XpND7V0L.jpg?w=300&h=400&fit=crop"
  },
  {
    title: "Zero to One",
    author: "Peter Thiel",
    image: "https://m.media-amazon.com/images/I/51zGCdRQXOL.jpg?w=300&h=400&fit=crop"
  },
  {
    title: "The 48 Laws of Power",
    author: "Robert Greene",
    image: "https://i.scdn.co/image/ab676663000022a8774c09f1f8a4c97ad6cbcaf7?w=300&h=400&fit=crop"
  },
  {
    title: "The Metamorphasis",
    author: "Franz Kafka",
    image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1699178982i/157112404.jpg?w=300&h=400&fit=crop"
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
    title: "1984",
    author: "George Orwell",
    image: "https://m.media-amazon.com/images/I/71wANojhEKL.jpg?w=300&h=400&fit=crop"
  },
  {
    title: "Lord of the Flies",
    author: "William Golding",
    image: "https://m.media-amazon.com/images/I/81t-Qi4X6HL._UF1000,1000_QL80_.jpg?w=300&h=400&fit=crop"
  }
];