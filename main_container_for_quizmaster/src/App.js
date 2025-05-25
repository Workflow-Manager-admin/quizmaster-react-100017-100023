import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// PUBLIC_INTERFACE
/**
 * QuizMaster React Main Container
 * Implements a multiple-choice quiz with timer, score, high score,
 * progress bar, answer review, and mobile responsiveness.
 * All question data is loaded from local JSON.
 */
const LOCAL_STORAGE_HIGH_SCORE_KEY = "quizmaster_highscore_v1";

/** Example questions array stored locally (replace with import for separate JSON). */
const QUESTIONS = [
  {
    question: "What is the capital city of France?",
    options: ["Berlin", "London", "Paris", "Madrid"],
    answer: 2,
  },
  {
    question: "Who wrote the play 'Romeo and Juliet'?",
    options: ["Shakespeare", "Dickens", "Hemingway", "Joyce"],
    answer: 0,
  },
  {
    question: "What is the boiling point of water at sea level (°C)?",
    options: ["90°C", "80°C", "100°C", "120°C"],
    answer: 2,
  },
  {
    question: "Which element has the symbol 'O'?",
    options: ["Gold", "Oxygen", "Osmium", "Oganesson"],
    answer: 1,
  },
  {
    question: "What's the largest planet in our Solar System?",
    options: ["Jupiter", "Saturn", "Earth", "Mars"],
    answer: 0,
  },
];

/** Quiz duration in seconds. */
const QUIZ_DURATION = 60;

/** Progress bar width calculation */
function getProgressPercent(currentIdx, total) {
  return Math.round(((currentIdx + 1) / total) * 100);
}

// PUBLIC_INTERFACE
function App() {
  // Quiz States
  const [started, setStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]); // stores user selected option indices
  const [score, setScore] = useState(0);

  // Timer
  const [remaining, setRemaining] = useState(QUIZ_DURATION);
  const intervalRef = useRef(null);

  // Review State
  const [showReview, setShowReview] = useState(false);

  // High score
  const [highScore, setHighScore] = useState(() =>
    Number(window.localStorage.getItem(LOCAL_STORAGE_HIGH_SCORE_KEY)) || 0
  );

  // --- TIMER EFFECT ---
  useEffect(() => {
    if (started && !quizFinished && !showReview) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, quizFinished, showReview]);

  // --- SCORE EFFECT ---
  useEffect(() => {
    // If user has finished quiz, compute and set high score (if necessary)
    if (quizFinished) {
      if (score > highScore) {
        setHighScore(score);
        window.localStorage.setItem(LOCAL_STORAGE_HIGH_SCORE_KEY, String(score));
      }
    }
  }, [quizFinished, score, highScore]);

  // PUBLIC_INTERFACE
  /** Handler: Start quiz */
  function handleStart() {
    setStarted(true);
    setQuizFinished(false);
    setShowReview(false);
    setCurrent(0);
    setAnswers([]);
    setScore(0);
    setRemaining(QUIZ_DURATION);
  }

  // PUBLIC_INTERFACE
  /** Handler: Select answer */
  function handleAnswer(optionIdx) {
    if (typeof answers[current] === "number") return; // Do not allow changing answer
    const correct = QUESTIONS[current].answer;
    const isCorrect = optionIdx === correct;
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = optionIdx;
      return next;
    });
    setScore((s) => (isCorrect ? s + 1 : s));
  }

  // PUBLIC_INTERFACE
  /** Handler: Next question */
  function handleNext() {
    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1);
    }
  }

  // PUBLIC_INTERFACE
  /** Handler: Previous question */
  function handlePrev() {
    if (current > 0) {
      setCurrent(current - 1);
    }
  }

  // PUBLIC_INTERFACE
  /** Handler: Finish quiz (either user or timer triggers) */
  function handleFinish() {
    setQuizFinished(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  // PUBLIC_INTERFACE
  /** Handler: Review answers (shows correct/incorrect highlights) */
  function handleReview() {
    setShowReview(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  // PUBLIC_INTERFACE
  /** Handler: Restart/Play Again */
  function handleRestart() {
    setStarted(false);
    setQuizFinished(false);
    setCurrent(0);
    setAnswers([]);
    setScore(0);
    setShowReview(false);
    setRemaining(QUIZ_DURATION);
  }

  // Helper: Get if current question has been answered
  function isAnswered(idx) {
    return typeof answers[idx] === "number";
  }

  // UI RENDERING ---
  if (!started) {
    // Home screen
    return (
      <div className="app">
        <Navbar />
        <main>
          <div className="container">
            <div className="hero">
              <div className="subtitle">👋 Welcome to Quizverse!</div>
              <h1 className="title">QuizMaster React</h1>
              <div className="description">
                Take a fun multi-choice quiz! Track your score, beat your high score, see what you missed, and race against the clock.
              </div>
              <button className="btn btn-large" onClick={handleStart}>Start Quiz</button>
              <div style={{ color: "#e2e2e2", marginTop: 16, fontSize: 13 }}>
                {highScore > 0 ? <>🔥 High Score: <b>{highScore}</b></> : "No high score yet"}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (quizFinished || remaining === 0) {
    // Result screen
    return (
      <div className="app">
        <Navbar />
        <main>
          <div className="container" style={{ paddingTop: 92 }}>
            <ResultView
              score={score}
              total={QUESTIONS.length}
              highScore={highScore}
              onRestart={handleRestart}
              onReview={handleReview}
              reviewed={showReview}
              answers={answers}
              questions={QUESTIONS}
            />
            <div style={{height:32}} />
            <Footer />
          </div>
        </main>
      </div>
    );
  }

  // Active quiz UI
  const currQ = QUESTIONS[current];

  return (
    <div className="app">
      <Navbar />
      <main>
        <div className="container" style={{ maxWidth: 600, marginTop: 90 }}>
          <QuizProgressBar
            percent={getProgressPercent(current, QUESTIONS.length)}
            timePercent={Math.round((remaining / QUIZ_DURATION) * 100)}
            remaining={remaining}
          />
          <div className="quiz-main" style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 2px 12px 0 rgba(16,16,16, 0.11)",
            borderRadius: 10,
            margin: "32px 0",
            padding: "clamp(18px,5vw,36px)",
            transition: "box-shadow .2s"
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8
            }}>
              <span style={{color:"var(--kavia-orange)", fontWeight: 500, fontSize: 15}}>
                Question {current+1} of {QUESTIONS.length}
              </span>
              <span style={{fontSize:14, color:"#e2e2e2"}}>
                Score: <b>{score}</b>
              </span>
            </div>
            <h2 className="quiz-question" style={{
              fontSize:"1.4rem", textAlign:"left", marginBottom:"24px"
            }}>
              {currQ.question}
            </h2>
            <div className="quiz-options" role="group" aria-label="answer options">
              {currQ.options.map((option, idx) => {
                const chosen = answers[current] === idx;
                let optionStyle = {};
                if(isAnswered(current)){
                  if(idx === currQ.answer) {
                    // correct
                    optionStyle.background = "rgba(90,190,110,0.14)";
                    optionStyle.borderColor = "#3DCC77";
                  }
                  if(chosen && idx !== currQ.answer){
                    // wrong
                    optionStyle.background = "rgba(232,78,64,0.14)";
                    optionStyle.borderColor = "#E84E40";
                  }
                }
                return (
                  <button
                    className="btn quiz-option"
                    key={idx}
                    disabled={isAnswered(current)}
                    style={{
                      width:"100%",
                      textAlign:"left",
                      fontWeight: 500,
                      boxSizing: "border-box",
                      border: "2px solid var(--border-color)",
                      margin: "8px 0",
                      borderRadius: 6,
                      background: chosen ? "rgba(232,122,65,0.09)" : "rgba(255,255,255,0.015)",
                      color: "white",
                      fontSize: "1rem",
                      padding: "12px 14px",
                      cursor: isAnswered(current) ? "not-allowed" : "pointer",
                      outline: chosen ? "2px solid var(--kavia-orange)" : "none",
                      transition: "background .16s, border .15s, outline .13s",
                      ...optionStyle,
                    }}
                    onClick={() => handleAnswer(idx)}>
                    {option}
                  </button>
                )
              })}
            </div>
            <div className="quiz-bottom-nav" style={{
              display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:22,gap:10,flexWrap:"wrap"
            }}>
              <button className="btn"
                  onClick={handlePrev}
                  disabled={current === 0}>
                &#8592; Previous
              </button>
              <div style={{flex:1}}/>
              {current !== QUESTIONS.length - 1 && (
                <button className="btn"
                  onClick={handleNext}
                  disabled={!isAnswered(current)}>
                  Next &#8594;
                </button>
              )}
              {current === QUESTIONS.length - 1 && (
                <button className="btn btn-large"
                  onClick={handleFinish}
                  disabled={!isAnswered(current)}>
                  Finish Quiz
                </button>
              )}
            </div>
          </div>
          <Footer />
        </div>
      </main>
      <style>
        {`
        @media (max-width: 700px) {
          .quiz-main { padding: 14px !important; }
          .quiz-question { font-size: 1rem !important;}
        }
        @media (max-width: 430px) {
            .container { padding: 0 5vw !important;}
            .quiz-main { font-size: 0.95rem;}
            .quiz-option { font-size:0.98rem !important;}
            .quiz-bottom-nav .btn { font-size:0.99rem !important;}
        }
        `}
      </style>
    </div>
  );
}

/**
 * Quiz progress bar displays percent and timer
 */
function QuizProgressBar({ percent, timePercent, remaining }) {
  return (
    <div style={{marginTop: 6, marginBottom:8, width:"100%"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,fontSize:13}}>
        <span style={{color:"var(--kavia-orange)"}}>Progress</span>
        <div style={{flex:1, height:8, background:"#232325",borderRadius:5,overflow:"hidden",position:"relative"}}>
          <div style={{
            width: `${percent}%`,
            background:"var(--kavia-orange)",
            height:"100%",
            borderRadius:5,
            transition:"width .25s"
          }}/>
        </div>
        <span>{percent}%</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:14,marginTop:8,marginBottom:3}}>
        <span style={{color:"#e2e2e2",fontSize:13}}>Time left</span>
        <div style={{flex:1, height:8, background:"#232325",borderRadius:5,overflow:"hidden",position:"relative"}}>
          <div style={{
            width: `${timePercent}%`,
            background:"linear-gradient(90deg,#E87A41 20%, #FFBA54 80%)",
            height:"100%",
            borderRadius:5,
            transition:"width .40s"
          }}/>
        </div>
        <span>{remaining}s</span>
      </div>
    </div>
  );
}

/**
 * End-of-quiz results view: shows score, high score, review/again buttons.
 */
function ResultView({ score, total, highScore, onRestart, onReview, reviewed, answers, questions }) {
  return (
    <div style={{
      background:"rgba(255,255,255,0.05)",
      border:"1px solid var(--border-color)",
      borderRadius:8,
      boxShadow:"0 6px 18px 0 rgba(32,24,8,.13)",
      padding:"36px 18px",
      textAlign:"center"
    }}>
      <h2 style={{color:"var(--kavia-orange)",fontWeight:700, fontSize:"2.3rem",marginBottom:14}}>
        Quiz Finished!
      </h2>
      <div style={{
        fontSize:"1.2rem",marginBottom:18
        }}>
        Your Score: <span style={{fontWeight:600, color:"#E87A41"}}>{score}/{total}</span>
      </div>
      <div style={{fontSize:15, color:"var(--text-secondary)"}}>
        {score === total ? "🏅 Perfect! You got everything right!" :
          score === 0   ? "😣 Ouch! Better luck next time."   :
          score > highScore ? "🎉 New High Score!" :
          highScore > 0 ? <>High Score: <b>{highScore}</b></> : ""
        }
      </div>
      <div style={{height:20}}/>
      {!reviewed && (
        <button className="btn" onClick={onReview} style={{marginRight:14}}>Review Answers</button>
      )}
      <button className="btn btn-large" onClick={onRestart}>Play Again</button>
      {reviewed && (
        <div style={{marginTop:28}}>
          <AnswerReview
            answers={answers}
            questions={questions}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Displays a review of all answers and correct/incorrect indication
 */
function AnswerReview({ answers, questions }) {
  return (
    <div>
      <h3 style={{color:"#FFBA54",fontWeight:600,fontSize: "1.08rem", marginBottom:12}}>Answer Review</h3>
      <div style={{display:"flex", flexDirection:"column", gap:24}}>
        {questions.map((q, idx) => {
          const userAns = answers[idx];
          const correct = q.answer;
          const isCorr = userAns === correct;
          return (
            <div
              key={idx}
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: 6,
                padding: "11px 12px"
              }}>
              <div style={{
                color: isCorr ? "#3dcc77" : "#E84E40",
                fontWeight:500
              }}>
                {isCorr ? "✔" : "✖"} Q{idx+1}: {q.question}
              </div>
              <div style={{marginTop:5,marginLeft:9}}>
                <span style={{color:"#fcfcfc"}}>Correct Answer: </span>
                <b style={{color:"#FFBA54"}}>{q.options[correct]}</b>
                <br/>
                <span style={{color:"#fcfcfc"}}>Your Answer: </span>
                {typeof userAns === "number" ? (
                  <b style={{
                    color: isCorr ? "#3dcc77" : "#E84E40"
                  }}>{q.options[userAns]}</b>
                ) : (
                  <span style={{ color: "#aaa" }}>Not Answered</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}

/** Top bar Kavia-style */
function Navbar() {
  return (
    <nav className="navbar">
      <div className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%"}}>
        <div className="logo">
          <span className="logo-symbol" style={{fontWeight:700}}>*</span> QuizMaster
        </div>
      </div>
    </nav>
  );
}

/** Simple footer */
function Footer() {
  return (
    <div style={{
      textAlign:"center",
      color:"var(--text-secondary)",
      fontSize:13,
      margin: "48px 0 32px 0"
    }}>
      Made with <span style={{color:"var(--kavia-orange)",fontWeight:600}}>React</span> • KAVIA Demo
    </div>
  )
}

export default App;
