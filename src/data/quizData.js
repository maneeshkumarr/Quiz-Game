export const quizData = {
  html: {
    title: "HTML Fundamentals",
    icon: "🏗️",
    color: "#FF6B6B",
    questions: [
      {
        id: 1,
        question: "What does HTML stand for?",
        options: [
          "Hyper Text Markup Language",
          "High Tech Modern Language",
          "Home Tool Markup Language",
          "Hyperlink and Text Markup Language"
        ],
        correct: 0
      },
      {
        id: 2,
        question: "Which HTML element is used for the largest heading?",
        options: ["<h6>", "<heading>", "<h1>", "<header>"],
        correct: 2
      },
      {
        id: 3,
        question: "What is the correct HTML element for inserting a line break?",
        options: ["<break>", "<br>", "<lb>", "<newline>"],
        correct: 1
      },
      {
        id: 4,
        question: "Which attribute is used to provide a unique identifier for an HTML element?",
        options: ["class", "name", "id", "key"],
        correct: 2
      },
      {
        id: 5,
        question: "Which HTML element is used to define internal CSS?",
        options: ["<css>", "<script>", "<style>", "<link>"],
        correct: 2
      }
    ]
  },
  css: {
    title: "CSS Styling",
    icon: "🎨",
    color: "#4ECDC4",
    questions: [
      {
        id: 1,
        question: "What does CSS stand for?",
        options: [
          "Cascading Style Sheets",
          "Computer Style Sheets",
          "Creative Style Sheets",
          "Colorful Style Sheets"
        ],
        correct: 0
      },
      {
        id: 2,
        question: "Which property is used to change the background color?",
        options: ["color", "bgcolor", "background-color", "background"],
        correct: 2
      },
      {
        id: 3,
        question: "How do you select an element with id 'demo'?",
        options: [".demo", "#demo", "demo", "*demo"],
        correct: 1
      },
      {
        id: 4,
        question: "Which property is used to change the text color of an element?",
        options: ["text-color", "fgcolor", "color", "font-color"],
        correct: 2
      },
      {
        id: 5,
        question: "What is the default value of the position property?",
        options: ["relative", "fixed", "absolute", "static"],
        correct: 3
      }
    ]
  },
  javascript: {
    title: "JavaScript Logic",
    icon: "⚡",
    color: "#FFE66D",
    questions: [
      {
        id: 1,
        question: "Which of the following is a JavaScript data type?",
        options: ["string", "boolean", "number", "All of the above"],
        correct: 3
      },
      {
        id: 2,
        question: "How do you declare a JavaScript variable?",
        options: ["var myVar;", "variable myVar;", "v myVar;", "declare myVar;"],
        correct: 0
      },
      {
        id: 3,
        question: "Which method is used to add an element to the end of an array?",
        options: ["push()", "add()", "append()", "insert()"],
        correct: 0
      },
      {
        id: 4,
        question: "What is the correct way to write a JavaScript array?",
        options: [
          "var colors = 'red', 'green', 'blue'",
          "var colors = (1:'red', 2:'green', 3:'blue')",
          "var colors = ['red', 'green', 'blue']",
          "var colors = 1 = ('red'), 2 = ('green'), 3 = ('blue')"
        ],
        correct: 2
      },
      {
        id: 5,
        question: "Which operator is used to assign a value to a variable?",
        options: ["*", "=", "x", "-"],
        correct: 1
      }
    ]
  },
  react: {
    title: "React Framework",
    icon: "⚛️",
    color: "#A8E6CF",
    questions: [
      {
        id: 1,
        question: "What is React?",
        options: [
          "A JavaScript library for building user interfaces",
          "A database management system",
          "A server-side framework",
          "A CSS framework"
        ],
        correct: 0
      },
      {
        id: 2,
        question: "Which method is used to render elements in React?",
        options: ["render()", "display()", "show()", "ReactDOM.render()"],
        correct: 3
      },
      {
        id: 3,
        question: "What is JSX?",
        options: [
          "A JavaScript extension syntax",
          "A CSS preprocessor",
          "A database query language",
          "A server framework"
        ],
        correct: 0
      },
      {
        id: 4,
        question: "Which hook is used to manage state in functional components?",
        options: ["useEffect", "useState", "useContext", "useReducer"],
        correct: 1
      },
      {
        id: 5,
        question: "What is the virtual DOM?",
        options: [
          "A copy of the real DOM kept in memory",
          "A new HTML standard",
          "A CSS framework",
          "A JavaScript engine"
        ],
        correct: 0
      }
    ]
  }
};

export const quizOrder = ['html', 'css', 'javascript', 'react'];