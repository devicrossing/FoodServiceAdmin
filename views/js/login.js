$('.message a').click(function () {
    $('form').animate({
        height: "toggle",
        opacity: "toggle"
    }, "slow");
});




$(".test").on('click', function () {
    alert($('.login-form .name').val());
});