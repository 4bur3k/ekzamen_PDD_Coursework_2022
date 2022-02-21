function restart(context) {
    addAction({
        type: "restart_by_voice"
    }, context);
}

function checkAnswer(answer, context) {
    addAction({
        type: "answer_by_voice",
        answer_ind: parseInt(answer) - 1, 
    }, context);
}