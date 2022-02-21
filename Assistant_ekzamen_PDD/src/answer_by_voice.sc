theme: /

    state: Вопрос
        q!: ( @duckling.number::answer | @duckling.ordinal::answer ) [номер|вариант]
        script: 
            checkAnswer($context.parseTree._answer, $context)