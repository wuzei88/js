var body = $response.body;
var regex = /"captions":\s*({.*?})/g;
var match = regex.exec(body);

if (match && match[1]) {
    var captions = JSON.parse(match[1]);

    if (captions && captions.playerCaptionsTracklist) {
        var tracks = captions.playerCaptionsTracklist;

        // 强制设置简体中文字幕
        for (var i = 0; i < tracks.length; i++) {
            if (tracks[i].languageCode === 'zh-Hans') {
                tracks[i].default = true;  // 设置简体中文为默认字幕
                break;
            }
        }
    }
}

$done({body: JSON.stringify(body)});
