if ($response && $response.body) {
  try {
    let obj = JSON.parse($response.body);
    if (!obj.data) obj.data = {};
    obj.data.is_vip = 1;
    obj.data.vip = true;
    obj.data.vip_expire_time = 4092599349000;
    obj.data.member = {
      level: 9,
      is_valid: 1,
      expire_time: 4092599349000
    };
    $done({ body: JSON.stringify(obj) });
  } catch (e) {
    $done({});
  }
} else {
  $done({});
}