# start command
`yarn dev`

# API
`/` -> list all icons

`/list` -> show supported streamers

`/list/:streamer` -> show icon list of streamer

`/list/open-dccon/:streamer` -> show open-dccon format icon list of streamer

`/images/:streamer/:filename(hashed).ext` -> get image

`/icon` -> get app icon

`/refresh/:streamer?key=` -> refresh streamer's data

`/search/:keyword` -> search icon by keyword. matched and candidates

`/search/:streamer/:keyword` -> search streamer's icon by keyword. matched and candidates



## 개선점

- `/list/:streamer` 접근 시에 파라미터로 `timestamp`값을 받아서 요청자의 데이터가 최신인지 확인하고 최신이면 `200`이 아닌 값으로, 최신이 아니면 아이콘 데이터를 전송하는 식으로 하면 트래픽 낭비를 줄일 수 있을 것임. 그리고 확장 프로그램에서도 `browser.alarms`를 사용하지 않고 브라우저 실행 시에만 api 요청하도록 하면 더 나을 것이다. 현재 서버에 걸리는 부하에 따라서 적용할 지를 결정하자.

- 트래픽이 많이 발생해서 이미지가 원인인 줄 알았으나 `json` 데이터를 전송하는데 `약 60Mb/s` 정도를 계속 사용하고 있었음. 예를 들어서 `funzinnu`의 `index.json`파일은 약 `400KB`인데 `compression` 미들웨어를 이용하면 `46KB` 정도로 트래픽 감소가 가능함. 

- `cloudflare`에서 규칙, 브라우저 캐시 TTL, 캐시 수준, 에지 캐시 TTL 설정하면 더 많은 트래픽 절약 가능 (링크)[https://stackoverflow.com/questions/11560101/caching-json-with-cloudflare]

- `iconProcessor` 각 함수의 공통 부분을 빼서 따로 선언하기
