'use strict';

define('admin/plugins/chat-perms', ['settings', 'alerts'], function (settings, alerts) {
    var ACP = {};

    ACP.init = function () {
        // Load settings
        settings.load('chat-perms', $('#chat-perms-settings'), function () {
            // Convert arrays to display format after load
            var adminUids = settings.get('chat-perms', 'adminUids');
            if (Array.isArray(adminUids)) {
                $('#adminUids').val(adminUids.join(','));
            }
            
            var alertRecipientUids = settings.get('chat-perms', 'alertRecipientUids');
            if (Array.isArray(alertRecipientUids)) {
                $('#alertRecipientUids').val(alertRecipientUids.join(','));
            }
            
            var keywordList = settings.get('chat-perms', 'keywordList');
            if (Array.isArray(keywordList)) {
                $('#keywordList').val(keywordList.join('\n'));
            }
        });

        // Save button handler
        $('#save').on('click', function () {
            // Convert comma-separated values to arrays
            var adminUidsVal = $('#adminUids').val();
            var adminUids = adminUidsVal ? adminUidsVal.split(',').map(function(s) { 
                return parseInt(s.trim(), 10); 
            }).filter(function(n) { return !isNaN(n); }) : [];
            
            var alertRecipientUidsVal = $('#alertRecipientUids').val();
            var alertRecipientUids = alertRecipientUidsVal ? alertRecipientUidsVal.split(',').map(function(s) { 
                return parseInt(s.trim(), 10); 
            }).filter(function(n) { return !isNaN(n); }) : [];
            
            var keywordListVal = $('#keywordList').val();
            var keywordList = keywordListVal ? keywordListVal.split('\n').map(function(s) { 
                return s.trim(); 
            }).filter(function(s) { return s.length > 0; }) : [];

            // Set array values
            settings.set('chat-perms', 'adminUids', adminUids);
            settings.set('chat-perms', 'alertRecipientUids', alertRecipientUids);
            settings.set('chat-perms', 'keywordList', keywordList);

            // Save all settings
            settings.save('chat-perms', $('#chat-perms-settings'), function () {
                alerts.success('הגדרות נשמרו בהצלחה');
            });
        });
    };

    return ACP;
});
