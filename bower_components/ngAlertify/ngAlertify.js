angular.module("ngAlertify", []).factory("alertify", function() {

    "use strict";

    // A quick hack to avoid exposing alertify to the window scope.
    var module = { exports: true };

    // Don't the line below as the alertif.js contents are
    // automatically injected here based on the string contents.
    (function() {

    "use strict";

    var TRANSITION_FALLBACK_DURATION = 500;
    var hasCss;

    var hideElement = function(el) {

        if (! el) {
            return;
        }

        var removeThis = function() {
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        };

        el.classList.add("hide");
        el.addEventListener("transitionend", removeThis);

        // Fallback for no transitions.
        setTimeout(removeThis, TRANSITION_FALLBACK_DURATION);

    };

    function Alertify() {

        /**
         * Alertify private object
         * @type {Object}
         */
        var _alertify = {

            defaultOkLabel: "Si",
            okLabel: "Si",
            defaultCancelLabel: "No",
            cancelLabel: "No",
            defaultMaxLogItems: 2,
            maxLogItems: 2,
            promptValue: "",
            promptPlaceholder: "",
            closeLogOnClick: false,
            closeLogOnClickDefault: false,
            delay: 5000,
            defaultDelay: 5000,

            dialogs: {
                buttons: {
                    holder: "<nav>{{buttons}}</nav>",
                    ok: "<button class='ok' tabindex='-1'>{{ok}}</button>",
                    cancel: "<button class='cancel' tabindex='-1'>{{cancel}}</button>"
                },
                input: "<input type='text'>",
                message: "<p class='msg'>{{message}}</p>",
                log: "<div class='{{class}}'>{{message}}</div>"
            },

            /**
             * Build the proper message box
             *
             * @param  {Object} item    Current object in the queue
             *
             * @return {String}         An HTML string of the message box
             */
            build: function(item) {

                var btnTxt = this.dialogs.buttons.ok;
                var html = "<div class='dialog'>" + "<div>" + this.dialogs.message.replace("{{message}}", item.message);

                if(item.type === "confirm" || item.type === "prompt") {
                    btnTxt = this.dialogs.buttons.cancel + this.dialogs.buttons.ok;
                }

                if (item.type === "prompt") {
                    html += this.dialogs.input;
                }

                html = (html + this.dialogs.buttons.holder + "</div>" + "</div>")
                  .replace("{{buttons}}", btnTxt)
                  .replace("{{ok}}", this.okLabel)
                  .replace("{{cancel}}", this.cancelLabel);

                return html;

            },

            setCloseLogOnClick: function(bool) {
                this.closeLogOnClick = !! bool;
            },

            /**
             * Close the log messages
             *
             * @param  {Object} elem    HTML Element of log message to close
             * @param  {Number} wait    [optional] Time (in ms) to wait before automatically hiding the message, if 0 never hide
             *
             * @return {undefined}
             */
            close: function(elem, wait) {

                if (this.closeLogOnClick) {
                    elem.addEventListener("click", function(ev) {
                        hideElement(ev.srcElement);
                    });
                }

                if (wait > 0) {
                    setTimeout(function() {
                        hideElement(elem);
                    }, (wait && !isNaN(+wait)) ? +wait : this.delay);
                }

            },

            /**
             * Create a dialog box
             *
             * @param  {String}   message      The message passed from the callee
             * @param  {String}   type         Type of dialog to create
             * @param  {Function} onOkay       [Optional] Callback function when clicked okay.
             * @param  {Function} onCancel     [Optional] Callback function when cancelled.
             *
             * @return {Object}
             */
            dialog: function(message, type, onOkay, onCancel) {
                this.setup({
                    type: type,
                    message: message,
                    onOkay: onOkay,
                    onCancel: onCancel
                });
            },

            /**
             * Show a new log message box
             *
             * @param  {String} message    The message passed from the callee
             * @param  {String} type       [Optional] Optional type of log message
             * @param  {Number} wait       [Optional] Time (in ms) to wait before auto-hiding the log
             *
             * @return {Object}
             */
            log: function(message, type, click) {

                var existing = document.querySelectorAll(".alertify-logs > div");
                if (existing) {
                    var diff = existing.length - this.maxLogItems;
                    if (diff >= 0) {
                        for (var i = 0, _i = diff + 1; i < _i; i++) {
                            this.close(existing[i], 1);
                        }
                    }
                }

                this.notify(message, type, click);

            },

            /**
             * Add new log message
             * If a type is passed, a class name "{type}" will get added.
             * This allows for custom look and feel for various types of notifications.
             *
             * @param  {String} message    The message passed from the callee
             * @param  {String} type       [Optional] Type of log message
             * @param  {Number} wait       [Optional] Time (in ms) to wait before auto-hiding
             *
             * @return {undefined}
             */
            notify: function(message, type, click) {

                var log = document.createElement("div");
                log.className = (type || "default");
                log.innerHTML = message;

                // Add the click handler, if specified.
                if ("function" === typeof click) {
                    log.addEventListener("click", click);
                }

                var elLog = document.querySelector(".alertify-logs");
                if (! elLog) {
                    elLog = document.createElement("div");
                    elLog.className = "alertify-logs";
                    document.body.appendChild(elLog);
                }

                elLog.appendChild(log);
                setTimeout(function() {
                    log.className += " show";
                }, 10);

                this.close(log, this.delay);

            },

            /**
             * Initiate all the required pieces for the dialog box
             *
             * @return {undefined}
             */
            setup: function(item) {

                var el = document.createElement("div");
                el.className = "alertify hide";
                el.innerHTML = this.build(item);

                var btnOK = el.querySelector(".ok");
                var btnCancel = el.querySelector(".cancel");
                var input = el.querySelector("input");

                // Set default value/placeholder of input
                if (input) {
                    if (typeof this.promptPlaceholder === "string") {
                        input.placeholder = this.promptPlaceholder;
                    }
                    if (typeof this.promptValue === "string") {
                        input.value = this.promptValue;
                    }
                }

                if (btnOK) {
                    btnOK.addEventListener("click", function(ev) {
                        if (item.onOkay && "function" === typeof item.onOkay) {
                            if (input) {
                                item.onOkay(input.value, ev);
                            } else {
                                item.onOkay(ev);
                            }
                        }
                        hideElement(el);
                    });
                }

                if (btnCancel) {
                    btnCancel.addEventListener("click", function(ev) {
                        if (item.onCancel && "function" === typeof item.onCancel) {
                            item.onCancel(ev);
                        }
                        hideElement(el);
                    });
                }

                document.body.appendChild(el);
                setTimeout(function() {
                    el.classList.remove("hide");
                }, 100);

            },

            okBtn: function(label) {
                this.okLabel = label;
                return this;
            },

            setDelay: function(time) {
                var dur = parseInt(time || 0, 10);
                this.delay = isNaN(dur) ? this.defultDelay : time;
                return this;
            },

            cancelBtn: function(str) {
                this.cancelLabel = str;
                return this;
            },

            setMaxLogItems: function(num) {
                this.maxLogItems = parseInt(num || this.defaultMaxLogItems);
            },

            reset: function() {
                this.okBtn(this.defaultOkLabel);
                this.cancelBtn(this.defaultCancelLabel);
                this.setMaxLogItems();
                this.promptValue = "";
                this.promptPlaceholder = "";
                this.delay = this.defaultDelay;
                this.setCloseLogOnClick(this.closeLogOnClickDefault);
            }

        };

        if (! hasCss) {
            var head = document.getElementsByTagName("head")[0];
            var css = document.createElement("style");
            css.type = "text/css";
            css.innerHTML = ".alertify-logs>*{padding:12px 24px;color:#fff;box-shadow:0 2px 5px 0 rgba(0,0,0,.2);border-radius:1px}.alertify-logs>*,.alertify-logs>.default{background:rgba(0,0,0,.8)}.alertify-logs>.error{background:rgba(244,67,54,.8)}.alertify-logs>.success{background:rgba(76,175,80,.9)}.alertify{position:fixed;background-color:rgba(0,0,0,.3);left:0;right:0;top:0;bottom:0;width:100%;height:100%;z-index:99999}.alertify.hide{opacity:0;pointer-events:none}.alertify,.alertify.hide,.alertify.show{box-sizing:border-box;-webkit-transition:all .33s cubic-bezier(.25,.8,.25,1);transition:all .33s cubic-bezier(.25,.8,.25,1)}.alertify,.alertify *{box-sizing:border-box}.alertify .dialog{padding:12px}.alertify .alert,.alertify .dialog{width:100%;margin:0 auto;position:relative;top:50%;-webkit-transform:translateY(-50%);-ms-transform:translateY(-50%);transform:translateY(-50%)}.alertify .alert>*,.alertify .dialog>*{width:400px;max-width:95%;margin:0 auto;text-align:center;padding:12px;background:#fff;box-shadow:0 2px 4px -1px rgba(0,0,0,.14),0 4px 5px 0 rgba(0,0,0,.098),0 1px 10px 0 rgba(0,0,0,.084)}.alertify .alert .msg,.alertify .dialog .msg{padding:12px;margin:0;text-align:left}.alertify .alert input,.alertify .dialog input{margin-bottom:15px;width:100%;font-size:100%;padding:12px}.alertify .alert input:focus,.alertify .dialog input:focus{outline-offset:-2px}.alertify .alert nav,.alertify .dialog nav{text-align:right}.alertify .alert nav button,.alertify .dialog nav button{background:0 0;box-sizing:border-box;color:rgba(0,0,0,.87);position:relative;outline:0;border:0;display:inline-block;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;padding:0 6px;margin:6px 8px;line-height:36px;min-height:36px;white-space:nowrap;min-width:88px;text-align:center;text-transform:uppercase;font-size:14px;text-decoration:none;cursor:pointer;border-radius:2px}.alertify .alert nav button:active,.alertify .alert nav button:hover,.alertify .dialog nav button:active,.alertify .dialog nav button:hover{background-color:rgba(0,0,0,.05)}.alertify .alert nav button:focus,.alertify .dialog nav button:focus{border-style:dashed}.alertify-logs{position:fixed;z-index:100;bottom:16px;left:16px}.alertify-logs>*{box-sizing:border-box;-webkit-transition:all .3s cubic-bezier(.25,.8,.25,1);transition:all .3s cubic-bezier(.25,.8,.25,1);margin-top:10px;position:relative;float:left;clear:both;-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0);-webkit-backface-visibility:hidden;backface-visibility:hidden;-webkit-perspective:1000;perspective:1000}.alertify-logs>.show{left:0;opacity:1}.alertify-logs>*,.alertify-logs>.hide{left:-110%;opacity:0}";
            head.insertBefore(css, head.firstChild);
            hasCss = true;
        }

        return {
            _$alertify: _alertify,
            reset: function() {
                _alertify.reset();
                return this;
            },
            alert: function(message, onOkay, onCancel) {
                _alertify.dialog(message, "alert", onOkay, onCancel);
                return this;
            },
            confirm: function(message, onOkay, onCancel) {
                _alertify.dialog(message, "confirm", onOkay, onCancel);
                return this;
            },
            prompt: function(message, onOkay, onCancel) {
                _alertify.dialog(message, "prompt", onOkay, onCancel);
                return this;
            },
            log: function(message, click) {
                _alertify.log(message, "default", click);
                return this;
            },
            success: function(message, click) {
                _alertify.log(message, "success", click);
                return this;
            },
            error: function(message, click) {
                _alertify.log(message, "error", click);
                return this;
            },
            cancelBtn: function(label) {
                _alertify.cancelBtn(label);
                return this;
            },
            okBtn: function(label) {
                _alertify.okBtn(label);
                return this;
            },
            delay: function(time) {
                _alertify.setDelay(time);
                return this;
            },
            placeholder: function(str) {
                _alertify.promptPlaceholder = str;
                return this;
            },
            defaultValue: function(str) {
                _alertify.promptValue = str;
                return this;
            },
            maxLogItems: function(num) {
                _alertify.setMaxLogItems(num);
                return this;
            },
            closeLogOnClick: function(bool) {
                _alertify.setCloseLogOnClick(!! bool);
                return this;
            }
        };
    }

    // AMD, window, and NPM support
    if ("undefined" !== typeof module && !! module && !! module.exports) {
        module.exports = Alertify;
    } else if (typeof define === "function" && define.amd) {
        define(function() {
            return new Alertify();
        });
    } else {
        window.alertify = new Alertify();
    }

}());


    var Alertify = module.exports;
    return new Alertify();

});
