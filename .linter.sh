#!/bin/bash
cd /home/kavia/workspace/code-generation/quizmaster-react-100017-100023/main_container_for_quizmaster
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

