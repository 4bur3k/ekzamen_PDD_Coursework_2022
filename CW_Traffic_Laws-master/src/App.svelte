<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
<script>
  import * as jsonTickets from "../public/laws.json"
  import {createSmartappDebugger, createAssistant} from '@sberdevices/assistant-client'
  import { onMount } from 'svelte'
  import { fly } from 'svelte/transition'

  let assistantId;

  const tickets = jsonTickets.tickets
  let current_ticket = 1
  let current_question = 0
  let progress = []
  let results = false
  let lastTickets = []
  let rightAnswerInd = -1
  let timeout = false

  let assistant;
  let token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZjAwMTQyZDBiMDYxMDEzNjk1NGNkYmMzM2E5MzQ4YjA2NzAxMTRhZTQ4MGIzYWIyMWUzOGU1MWMzYzRmZDEyMjFhZGQiLCJhdWQiOiJWUFMiLCJleHAiOjE2NDM4ODcwOTQsImlhdCI6MTY0MzgwMDY4NCwiaXNzIjoiS0VZTUFTVEVSIiwidHlwZSI6IkJlYXJlciIsImp0aSI6ImM1ZGEyZDA4LTNiYjMtNDRjNS1hNzI0LTVlYTMwOTRiNTI4MCIsInNpZCI6ImE0NTc5MzViLTM4N2UtNDkwNC04NjA1LTQxMTMzMDQ0YmQyNyJ9.l2UcjAyhu4V3lxELheHn9J2Qi7NY4ZhIFBbJSLJnzJ-Gz78LOvRXvn0-FLUm_DbXlPpWwhhPRWAWEb9leK9OxgocJdQmUvtUjff7N29t69OhZWapO_Q6lPuvR9LnCHQ_Cyd2hacY3fDiGs9IIIR1MxdZ-ewQC7R1nUgtqinXJdBE_s-OqjlGFG9Mu8C8plU_sjjvPXqqFFxJbg2S4kGCx94QrLfQ4xJRHs0UznWNT3o454z6QPpFRh7ee59Hi4E-oMhoYuInvzPDayWkmf7utN4DdZd_JIgcBuLyKCC3suItaOSWGRJKvj-ku43siwiC_kkNpD-tLz8_GwRvYZD_kAxP3WTTcDCM5fAP-RNFoVtVcBnRIiHXc8Ri9_8-LkYxEtXWSHt2vr6m1JqfpVqnaQ3wjoLtb08Y_hD3srrYD_IJ_w_v6SO6nKi48yKBalyL_5mknQGREnT6Y1IJaOET7Ndmgu2BeXTS2gOY8WiJkq7fehY5detHWoBVaEPIRODSgIsnVy6apr0VyutBzTsnoxTmahkMWmzBgLFn8E3_C80hb-DmaIUWkPCwO_qnk_g7wVmuwEEJ795yA2RqyaPeVuuVjXUW7fbHbXFjmju9B9ZuZnxhnChhUE9Cq1O9blrZuD4u2jnVFQc994dxR2_1-LO8KeNgKJjTiB171gjEFyQ';
  let initPhrase = 'Включи экзамен ПДД'

  function getState() {
    console.log("State was get");
    const state = {
      item_selector: {
        items: [
          tickets['ticket_'+current_ticket][current_question].question, // question
          tickets['ticket_'+current_ticket][current_question].answers, //answers
          tickets['ticket_'+current_ticket][current_question].right_answer // right answer
        ]
      }
    }
    return state;
  }

  onMount(() => {
    const init = () => {
      // return createSmartappDebugger({
      //   token,
      //   initPhrase,
      //   getState,
      //   settings: {}
      // })
      return createAssistant({getState});
    }
    assistant = init();
    assistant.on("start", (event) => {
      console.log(`assistant.on(start)`, event);
    });
    assistant.on("data", (event) => {
      console.log('EVENT!!!', event);
      if (event.character) {
        assistantId = event.character.id
      }
      if (!event.action)
        return;
      switch(event.action.type) {
        case 'answer_by_voice':
          checkAnswer(event.action.answer_ind)
          break
        case 'restart_by_voice':
          restart()
      }
    })

    defaultProgress()
    generateTicketNumber()
    // assistant.sendData({action: {action_id: 'voiceQuestion'}})
  })

  function defaultProgress() {
    let newProgress = []
    for (let num = 0; num < 20; num++) {
      newProgress.push(0)
    }
    progress = newProgress
  }

  function checkAnswer(answerInd) {
    if (timeout) return
    timeout = true
    const rightInd = tickets['ticket_'+current_ticket][current_question].right_answer.slice(-1)
    let timeoutValue = 1200
    if (answerInd+1 === parseInt(rightInd)) {
      progress[current_question] = 1
      // assistant.sendData({action: {action_id: 'voiceRight'}})
      // timeoutValue = 2000
    } else {
      progress[current_question] = -1
      // assistant.sendData({action: {action_id: 'voiceWrong'}})
    }
    rightAnswerInd = parseInt(rightInd)-1
    setTimeout(nextQuestion, timeoutValue)
  }

  function nextQuestion() {
    if (current_question === 19) {
      results = true
      return
    }
    rightAnswerInd = -1
    current_question++
    timeout = false
    // assistant.sendData({action: {action_id: 'voiceQuestion'}})
  }

  function restart() {
    generateTicketNumber()
    defaultProgress()
    current_question = 0

    timeout = false;
    rightAnswerInd = -1
    results = false
  }

  function generateTicketNumber() {
    let ticketNumber
    do {
      ticketNumber = Math.floor(Math.random() * 39) + 1
    } while (lastTickets.indexOf(ticketNumber) !== -1)
    current_ticket = ticketNumber
    lastTickets.push(ticketNumber)
  }

  function reformatQuestion(question) {
    console.log(assistantId)
    // if (assistantId === 'joy') { // joy
    //   const trickyPhrases = {
    //     'Вы управляете': 'ты управляешь',
    //     'Вы можете': 'ты можешь',
    //     'Вы должны': 'ты должен',
    //     'Вы обязаны': 'ты обязан',
    //     'Вы имеете': 'ты имеешь',
    //     'Вы попадаете': 'ты попадаешь',
    //     'Вы въехали': 'ты въехал',
    //     'Вы поворачиваете': 'ты поворачиваешь',
    //     'Вы включить': 'ты включить',
    //     'Вы намерены': 'ты намерен',
    //     'Вы проживаете или работаете': 'ты проживаешь или работаешь',
    //     'Можете ли Вы': 'Можешь ли ты',
    //     'Должны ли вы': 'Должен ли ты',
    //     'Вы остановиться': 'ты остановиться',
    //     'Вы движетесь': 'ты движешься',
    //     'Вы уступить': 'ты уступить',
    //     'Вы проживаете': 'ты проживаешь',
    //     'Вы приступить': 'ты приступить',
    //     'Вы догнали': 'ты догнал',
    //     'Вам': 'тебе',
    //     'Вашего': 'твоего',
    //     'Ваши': 'твои',
    //     'Вашему': 'твоему',
    //   }
    //   for (const key in trickyPhrases) {
    //     question = question.replace(key, trickyPhrases[key])
    //   }
    // }
    // question = question.replace(':', '');
    const lowerCasePhrases = ['Вы', 'Вам', 'Вашего', 'Ваши', 'Вашему']
    lowerCasePhrases.forEach(phrase => {
      if (question.indexOf(phrase) !== 0) {
        question = question.replace(phrase, phrase.toLowerCase())
      }
    })
    return question
  }
</script>

<main>
  <div id="progress-bar">
    {#each progress as progress_mark, num}
      <div
        class="progress-block"
        class:current={num === current_question}
        class:not-solved={progress_mark === 0}
        class:right={progress_mark === 1}
        class:wrong={progress_mark === -1}
      >
        {num + 1}
      </div>
    {/each}
  </div>

  {#if results}
    <div id="results-block" in:fly="{{ y: 400, duration: 1000 }}">
      <h1>Результат по билету - {progress.filter(el => el===1).length}/20</h1>
      <button on:click={restart}>Попробовать еще</button>
    </div>
  {:else}
    <div id="quiz-block">
      <div id="img-block">
        <img src={tickets['ticket_'+current_ticket][current_question].image}>
      </div>
      <div id="question-block">
        <h2>«{reformatQuestion(tickets['ticket_'+current_ticket][current_question].question)}»</h2>
      </div>

      <div id="answers-block">
        {#each tickets['ticket_'+current_ticket][current_question].answers as answer, answerInd}
          <div
              class="answer"
              class:right-answer={rightAnswerInd === answerInd}
              tabindex=0
              on:click={() => checkAnswer(answerInd)}>
            <h3>{answer}</h3>
          </div>
        {/each}
      </div>
<!--      <div id="question-block">-->
<!--        <h2>-->
<!--          Может ли владелец мотоцикла с рабочим объёмом двигателя внутреннего сгорания, не превышающим 125 см3 , и максимальной мощностью, не превышающей 11 квт, передавать управление этим транспортным средством в своём присутствии другому лицу, имея при этом соответствующий страховой полис?-->
<!--        </h2>-->
<!--      </div>-->

<!--      <div id="answers-block">-->
<!--        <div class="answer">-->
<!--          <h3>-->
<!--            Может при наличии у этого лица водительского удостоверения на право управления транспортным средством категории «А» или подкатегории «А1»-->
<!--          </h3>-->
<!--        </div>-->
<!--        <div class="answer">-->
<!--          <h3>-->
<!--            Может при наличии у этого лица водительского удостоверения на право управления транспортным средством категории «А» или подкатегории «А1»-->
<!--          </h3>-->
<!--        </div>-->
<!--        <div class="answer">-->
<!--          <h3>-->
<!--            Может при наличии у этого лица водительского удостоверения на право управления транспортным средством категории «А» или подкатегории «А1»-->
<!--          </h3>-->
<!--        </div>-->
<!--        <div class="answer">-->
<!--          <h3>-->
<!--            Может при наличии у этого лица водительского удостоверения на право управления транспортным средством категории «А» или подкатегории «А1»-->
<!--          </h3>-->
<!--        </div>-->
<!--      </div>-->
    </div>
  {/if}
</main>

<style>
  main {
    font-size: 1.5vh;
    font-family: 'Roboto', sans-serif;
    padding-bottom: 20%;
  }

  #progress-bar {
    display: flex;
    overflow-x: scroll;
    margin-top: 20px;
  }

  #progress-bar::-webkit-scrollbar {
    width: 0;
  }

	.progress-block {
    min-width: 30px;
    min-height: 30px;
    border-radius: 10px;
    margin: 0 10px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .not-solved {
    border: 1px solid #76CFFA;
  }

  .current {
    background-color: #76CFFA;
  }

  .right {
    border: 1px solid #34F02C !important;
    /*background-color: #34F02C;*/
  }

  .wrong {
    border: 1px solid #FA471F;
    /*background-color: #FA471F;*/
  }

  #quiz-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  #img-block {
    width: 90%;
    max-width: 600px;
    margin-top: 30px;
  }

  #img-block img {
    width: 100%;
    border-radius: 20px;
  }

  #answers-block {
    width: 95%;
  }

  .answer {
    border-radius: 20px;
    border: 1px solid #76CFFA;
    margin: 20px 0;
    width: 100%;
  }

  .answer h3 {
    margin: 10px 20px;
  }

  .right-answer {
    background-color: #34F02C;
  }
  /*.answer:focus {*/
  /*  background-color: #76CFFA;*/
  /*}*/

  #results-block {
    border: 1px solid #76CFFA;
    border-radius: 20px;
    text-align: center;
    margin: 50px 15px
  }

  #results-block button {
    background-color: transparent;
    padding: 10px 20px;
    border-radius: 10px;
  }

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>