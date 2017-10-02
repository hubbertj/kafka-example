
// A $( document ).ready() block.
// $(document).ready(function() {
//     console.log("ready!");

// });

console.log('here');

(function(win){
    console.log(win);
    win.kafka = {
        init: function() {
            $("#post-form").submit(function() {
                var inputs = $("#post-form input");
                var data = {};

                inputs.each(function(index, element) {
                    var name = $(element).attr('name');
                    if (name != null) {
                        data[name] = $(element).val();
                    }
                });

                $.ajax({
                    type: 'POST',
                    url: config.https.postExample,
                    data: data,
                    dataType: "json",
                    success: function(resultData) {

                        console.log("Save Complete");

                        $("#alerts")
                            .addClass("alert alert-success")
                            .text("Posted the results :)");

                        setTimeout('kafka.extra.clear()', 5000);

                    },
                    error: function(err) {
                        console.error(err);
                        $("#alerts")
                            .addClass("alert alert-danger")
                            .text(err.statusText);

                        setTimeout('kafka.extra.clear()', 5000);
                    }
                });

                return false;
            });
        },

        config: {
            https: { postExample: "/post-example" },
            server: '127.0.0.1:8000'
        },

        extra: {
            clear: function() {
                $("#alerts").removeClass().text("");
            }
        }
    };

})(window);

window.kafka.init();