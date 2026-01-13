'use strict';

define('admin/plugins/chat-perms', ['api', 'alerts'], function (api, alerts) {
    var ACP = {};

    ACP.init = function () {
        // Load settings on page load
        api.get('/admin/plugins/chat-perms/settings', {}).then(function(settings) {
            if (settings) {
                // Populate form fields
                $('#adminUids').val(Array.isArray(settings.adminUids) ? settings.adminUids.join(',') : settings.adminUids || '');
                $('#allowChatGroup').val(settings.allowChatGroup || '');
                $('#denyChatGroup').val(settings.denyChatGroup || '');
                $('#minReputation').val(settings.minReputation || 10);
                $('#minPosts').val(settings.minPosts || 5);
                $('#warningEnabled').prop('checked', settings.warningEnabled === true || settings.warningEnabled === 'on');
                $('#warningMessage').val(settings.warningMessage || '');
                $('#warningDisplayType').val(settings.warningDisplayType || 'banner');
                $('#keywordAlertsEnabled').prop('checked', settings.keywordAlertsEnabled === true || settings.keywordAlertsEnabled === 'on');
                $('#keywordList').val(Array.isArray(settings.keywordList) ? settings.keywordList.join('\n') : settings.keywordList || '');
                $('#alertRecipientUids').val(Array.isArray(settings.alertRecipientUids) ? settings.alertRecipientUids.join(',') : settings.alertRecipientUids || '');
                $('#chatNotYetAllowedMessage').val(settings.chatNotYetAllowedMessage || '');
                $('#chatDeniedMessage').val(settings.chatDeniedMessage || '');
            }
        }).catch(function(err) {
            console.log('[chat-perms] Could not load settings:', err);
        });

        // Save button handler
        $('#save').on('click', function () {
            var settings = {
                adminUids: $('#adminUids').val().split(',').map(function(s) { 
                    return parseInt(s.trim(), 10); 
                }).filter(function(n) { return !isNaN(n); }),
                allowChatGroup: $('#allowChatGroup').val(),
                denyChatGroup: $('#denyChatGroup').val(),
                minReputation: parseInt($('#minReputation').val(), 10) || 10,
                minPosts: parseInt($('#minPosts').val(), 10) || 5,
                warningEnabled: $('#warningEnabled').is(':checked'),
                warningMessage: $('#warningMessage').val(),
                warningDisplayType: $('#warningDisplayType').val(),
                keywordAlertsEnabled: $('#keywordAlertsEnabled').is(':checked'),
                keywordList: $('#keywordList').val().split('\n').map(function(s) { 
                    return s.trim(); 
                }).filter(function(s) { return s.length > 0; }),
                alertRecipientUids: $('#alertRecipientUids').val().split(',').map(function(s) { 
                    return parseInt(s.trim(), 10); 
                }).filter(function(n) { return !isNaN(n); }),
                chatNotYetAllowedMessage: $('#chatNotYetAllowedMessage').val(),
                chatDeniedMessage: $('#chatDeniedMessage').val()
            };

            api.put('/admin/plugins/chat-perms/settings', settings).then(function() {
                alerts.success('הגדרות נשמרו בהצלחה');
            }).catch(function(err) {
                alerts.error('שגיאה בשמירת ההגדרות: ' + err.message);
            });
        });
    };

    return ACP;
});
