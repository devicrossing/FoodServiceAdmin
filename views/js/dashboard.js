// https://dribbble.com/shots/1640899-Freebie-Course-Dashboard

$('nav a, .nav2 a').on('click', function () {
    $(this).addClass('active');
    $(this).parents('li').siblings().children('a').removeClass('active');
});

$(document).ready(function () {
    if ($("[rel=tooltip]").length) {
        $("[rel=tooltip]").tooltip();
    }
});