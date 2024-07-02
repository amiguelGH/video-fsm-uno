import React from "react";
import { useMachine} from "@xstate/react";
import { assign,  fromPromise,  setup,  fromObservable} from "xstate";
import { percentage, minutes, seconds } from "./utils";
import {Logger, ConsoleLogger} from 'react-console-logger';
import { interval } from "rxjs";


import "./reset.css";
import "./App.css";


const pino = require("pino");
const logger = pino({
  transport: {
    target: "pino-pretty",
  },
});

logger.info('Hello World');

const myLogger = new Logger();
  





/**
 * Video State Machine
 */

 

const videoMachine = setup({
  types:{},
  
  actions:{
    
    setVideo :  
       assign({
        video: ({event}) => event.video,
        duration: ({event}) => event.video.duration
      }),
    
      
      
    

    iniciaObservador : ({context, _event}) => {
      if(context.observa == null)
      {
        context.observa = interval(1000);
        context.suscrito = context.observa.subscribe(snapshot => {
          console.log('MiNuevoEstado', context);
        });
        //context.suscrito.start();
      }
      
    },
  

    
    paraObservador : assign({
      duration: ({context, _event}) => context.video.currentTime,
    }),

    activaObservador : ({context, _event}) => {
      myLogger.error("activaObservador");
    },
    

    setElapsed : assign({
      elapsed: ({context, _event}) => context.video.currentTime,
    }),
    
    setTime : assign({
      elapsed: ({context, _event}) => context.video.currentTime
    }),

    playVideo : ({context, _event}) => {
      context.video.play();  
      context.suscrito = null;
    },

    logAction : ({context, _event}) => {
      myLogger.info("Preparando video ");
    },
    
    pauseVideo : ({context, _event}) => {
      context.video.pause();
      myLogger.error("Avance:"+context.avance);
      context.avance = context.video.currentTime;
      
      if(context.observa != null)
      {
          context.suscrito = context.observa.subscribe(snapshot => {
            //console.log('MiOtroEstado', context);
            myLogger.log("Avance:"+context.avance+"\tElapsed:"+context.elapsed);
          });
          //context.suscrito.start();
      }
     
      
      
    },

    progressVideo : ({context, _event}) => {
      myLogger.warn("Avance:"+context.avance);
    },

    setAvance : assign({
      avance: ({context, _event}) => Math.floor((context.video.currentTime/context.video.duration)*100),
    }),

    setObsAvance : ({context, _event}) => {
      myLogger.warn(interval(context.avance, 3000));
    },

    
    restartVideo : ({context, _event}) => {
      context.video.currentTime = 0;
      context.video.play();
      context.video.numVideos = context.video.numVideos +1;
    },

    setNumVideos : ({context, _event}) => {
      context.video.numVideos = context.video.numVideos +1;
    },

    },
    guards:{},
    delays:{},
    actors:{
      

      iniciadorIntervalo :  fromPromise(({sendBack, receive}) => {
        // Start the ticks activity
        const interval = setInterval(() => {
        //console.log(event); // this is the activity instance, not the event
        // I need access to the event that triggered the transition to this activity's state (RUN)
        console.log('TICK!')
        }, 1000);
        // Return a function that stops the ticks activity
      return () => clearInterval(interval);
      }),

      sendEmail: fromPromise(async ({ input }) => {
        console.log('Sending email to', input.userId);        
        //const user = await fetchEmail(input.userId);  
        return "exito";
      }),
      
      intervalLogic : fromObservable(() => {
        return interval(1000);        
      }),

     
}
})
.createMachine( 
  {
    context: () => ({
      video: null,
      duration: 0,
      elapsed: 0,
      numVideos: 0,
      avance: 0,
      myInterval: 5000,
      intervalId: null,
      userId: "amiguel777@gmail.com",
      observador: "vacio",
      suscrito: null,
      observa: null,
      observando: 0,
      feedback: 'Some feedback',
      creado: Date.now(),
    }),
      
    id: "video",
    initial: "loading",
    states: {
      loading: {
        invoke: {
          input: {},
          src: "intervalLogic",
          onSnapshot: {
            actions: ({ event }) => {
              console.log(event.snapshot.context); // 1, 2, 3, ...
            }
          }
        },
        on: {
          

          
          "control.boton.oprime.ready": [
            {
              target: "ready",
              actions: [
                {
                  type: "setVideo",
                },
                {
                  type: "logAction",
                },
                {
                  type: "iniciaObservador",
                },
              ],
            },
          ],
          FAIL: [
            {
              target: "failure",
              actions: [],
            },
          ],
        },
      },
      observando: {
        
        initial: "pausadoObservando",
        states: {
          pausadoObservando: {
            entry: {
              type: "paraObservador",
            },
            exit: {
              type: "activaObservador",
            },
            on: {
              "control.boton.oprime.activaObservador": [
                {
                  target: "registraObservando",
                  actions: [],
                },
              ],
            },
          },
          registraObservando: {
            entry: {
              type: "iniciaObservador",
            },
            exit: {
              type: "reIniciaObservador",
            },
            on: {
              "control.boton.oprime.desactivaObservador": [
                {
                  target: "pausadoObservando",
                  actions: [],
                },
              ],
            },
          },
          
        },
      },
      ready: {
        initial: "paused",
        states: {
          paused: {
            entry: {
              type: "setElapsed",
            },
            exit: {
              type: "playVideo",
            },
            on: {
              "control.boton.oprime.play": [
                {
                  target: "playing",
                  actions: [],
                },
              ],
            },
          },
          playing: {
            entry: {
              type: "setElapsed",
            },
            exit: {
              type: "pauseVideo",
            },
            on: {
              COUNT: [
                {
                  actions: [
                    {
                      type: "notifyCount",
                    },
                  ],
                },
              ],
              TIMING: [
                {
                  target: "playing",
                  actions: [
                    {
                      type: "setElapsed",
                    },
                    {
                      type: "setAvance",
                    },
                    {
                      type: "progressVideo",
                    },
                  ],
                },
              ],
              "control.boton.oprime.pause": [
                {
                  target: "paused",
                  actions: [],
                },
              ],
              "control.boton.oprime.stop": [
                {
                  target: "ended",
                  actions: [],
                },
              ],
            },
          },
          ended: {
            invoke: {
              input: {},
              src: "iniciador",
            },
            on: {
              setNumVideos: [
                {
                  actions: [
                    {
                      type: "inline:video.ready.ended#setNumVideos[-1]#transition[0]",
                    },
                  ],
                },
              ],
              "control.boton.oprime.play": [
                {
                  target: "playing",
                  actions: [
                    {
                      type: "restartVideo",
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      failure: {
        type: "final",
      },
      invoke: {},
    },
  },
  
);






/**
 * Components
 */

export default function App() {
  const ref = React.useRef(null);
  const [current, send] = useMachine(videoMachine);
  const { duration, elapsed, avance } = current.context;
  
  

  
  return (
    <div className="container">
      <video
        ref={ref}
        onCanPlay={() => {
          send({type:"control.boton.oprime.ready",  video: ref.current });
        }}
        onTimeUpdate={() => {
          send({type:"TIMING",  video: ref.current});
        }}
        onEnded={() => {
          send({type:"control.boton.oprime.stop"});
        }}
        onError={() => {
          send({type:"FAIL"});
        }}
      >
        <source src="/fox.mp4" type="video/mp4" />
      </video>

      {["paused", "playing", "ended"].some(subState =>
        current.matches({ ready: subState })
      ) && (
        <div>
          <ElapsedBar elapsed={elapsed} duration={duration} />
          <Buttons current={current} send={send} />
          <Timer elapsed={elapsed} duration={duration} avance = {avance} />
          <ButtonObservador current={current} send={send} />
      </div>

        
      )}

      <div>
        <ConsoleLogger   logger={myLogger} />
      </div>
    </div>
  );
}

const Buttons = ({ current, send }) => {
  if (current.matches({ ready: "playing" })) {
    return (
      <button
        onClick={() => {
          send({type:"control.boton.oprime.pause"});
        }}
      >
        Pause
      </button>
    );
  }

  return (
    <button style={{backgroundColor: '#DDD'}}
      onClick={() => {
        send({type:"control.boton.oprime.play"});
      }}
    >
      Play
    </button>
  );
};


const ButtonObservador = ({ current, send }) => {
  
  
  if (current.context.video !== null) {
    return (
      <button  style={{backgroundColor: '#CCC'}}
        onClick={() => {
          send({type:"control.boton.oprime.startObservador"});
        }}
      >
        Observar
      </button>
    );
  }

  return (
    <button style={{backgroundColor: '#AAA'}}
      onClick={() => {
        send({type:"control.boton.oprime.stopObservador"});
      }}
    >
      Observando
    </button>
  );
};


const ElapsedBar = ({ elapsed, duration }) => (
  <div className="elapsed">
    <div
      className="elapsed-bar"
      style={{ width: `${percentage(duration, elapsed)}%` }}
    />
  </div>
);

const Timer = ({ elapsed, duration }) => (
  <span className="timer">
    {minutes(elapsed)}:{seconds(elapsed)} of {minutes(duration)}:
    {seconds(duration)}
  </span>
);
     