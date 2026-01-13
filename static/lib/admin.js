'use strict';

define('admin/plugins/chat-perms', [], function () {
    var ACP = {};

    ACP.init = function () {
        var basePath = (typeof config !== 'undefined' && config.relative_path) ? config.relative_path : '';
        var csrfToken = (typeof config !== 'undefined' && config.csrf_token) ? config.csrf_token : '';

        loadSettings(basePath);
        bindEvents(basePath, csrfToken);
    };

    function loadSettings(basePath) {
        $.get(basePath + '/api/admin/plugins/chat-perms/settings', function (s) {
            if (s) {
                $('#adminUids').val(Array.isArray(s.adminUids) ? s.adminUids.join(',') : s.adminUids || '');
                $('#allowChatGroup').val(s.allowChatGroup || '');
                $('#denyChatGroup').val(s.denyChatGroup || '');
                $('#minReputation').val(s.minReputation || 10);
                $('#minPosts').val(s.minPosts || 5);
                $('#warningEnabled').prop('checked', s.warningEnabled === true);
                $('#warningMessage').val(s.warningMessage || '');
                $('#warningDisplayType').val(s.warningDisplayType || 'banner');
                $('#keywordAlertsEnabled').prop('checked', s.keywordAlertsEnabled === true);
                $('#keywordList').val(Array.isArray(s.keywordList) ? s.keywordList.join('\n') : '');
                $('#alertRecipientUids').val(Array.isArray(s.alertRecipientUids) ? s.alertRecipientUids.join(',') : '');
                $('#chatNotYetAllowedMessage').val(s.chatNotYetAllowedMessage || '');
                $('#chatDeniedMessage').val(s.chatDeniedMessage || '');
            }
        });
    }

    function bindEvents(basePath, csrfToken) {
        $('#save').on('click', function () {
            var data = {
                adminUids: $('#adminUids').val().split(',').map(function (x) { return parseInt(x.trim(), 10); }).filter(function (x) { return !isNaN(x); }),
                allowChatGroup: $('#allowChatGroup').val(),
                denyChatGroup: $('#denyChatGroup').val(),
                minReputation: parseInt($('#minReputation').val(), 10) || 10,
                minPosts: parseInt($('#minPosts').val(), 10) || 5,
                warningEnabled: $('#warningEnabled').is(':checked'),
                warningMessage: $('#warningMessage').val(),
                warningDisplayType: $('#warningDisplayType').val(),
                keywordAlertsEnabled: $('#keywordAlertsEnabled').is(':checked'),
                keywordList: $('#keywordList').val().split('\n').map(function (x) { return x.trim(); }).filter(function (x) { return x; }),
                alertRecipientUids: $('#alertRecipientUids').val().split(',').map(function (x) { return parseInt(x.trim(), 10); }).filter(function (x) { return !isNaN(x); }),
                chatNotYetAllowedMessage: $('#chatNotYetAllowedMessage').val(),
                chatDeniedMessage: $('#chatDeniedMessage').val()
            };

            $.ajax({
                url: basePath + '/api/admin/plugins/chat-perms/settings',
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(data),
                headers: { 'x-csrf-token': csrfToken },
                success: function () {
                    if (typeof app !== 'undefined' && app.alertSuccess) {
                        app.alertSuccess('הגדרות נשמרו בהצלחה');
                    } else {
                        alert('הגדרות נשמרו בהצלחה');
                    }
                },
                error: function () {
                    if (typeof app !== 'undefined' && app.alertError) {
                        app.alertError('שגיאה בשמירה');
                    } else {
                        alert('שגיאה בשמירה');
                    }
                }
            });
        });
    }

    return ACP;
});
