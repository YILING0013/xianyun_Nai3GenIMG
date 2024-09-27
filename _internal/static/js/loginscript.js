$(document).ready(function() {
    $(".info-item .btn").click(function() {
        $(".container").toggleClass("log-in");
    });

    $("#log-in").click(function() {
        var token = $("input[name='Password']").val();

        fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({token: token })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 存储用户的 Opus 值
                sessionStorage.setItem('userOpus', data.opus);
                window.location.href = data.redirect;
            } else {
                alert("登录失败: " + data.message);
            }
        })
        .catch(error => {
            console.error('登录请求失败:', error);
        });
    });
});
