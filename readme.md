# start command
`yarn dev`

# API
`/` -> list all icons

`/list` -> show supported streamers

`/list/:streamer` -> show all icon lists of streamer

`/images/:streamer/:filename(hashed).ext` -> get image

`/icon` -> get app icon

`/refresh/:streamer?key=` -> refresh streamer's data



## 개선점

- `/list/:streamer` 접근 시에 파라미터로 `timestamp`값을 받아서 요청자의 데이터가 최신인지 확인하고 최신이면 `200`이 아닌 값으로, 최신이 아니면 아이콘 데이터를 전송하는 식으로 하면 트래픽 낭비를 줄일 수 있을 것임. 그리고 확장 프로그램에서도 `browser.alarms`를 사용하지 않고 브라우저 실행 시에만 api 요청하도록 하면 더 나을 것이다. 현재 서버에 걸리는 부하에 따라서 적용할 지를 결정하자.