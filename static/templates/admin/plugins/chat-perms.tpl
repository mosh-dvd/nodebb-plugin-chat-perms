<div class="acp-page-container">
    <div class="row">
        <div class="col-lg-9">
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title">הגדרות הרשאות צ'אט</h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <i class="fa fa-info-circle"></i>
                        הערה: אם מוגדרים משתני סביבה בשרת (CHAT_PERMS_PLUGIN_SETTINGS), הם יקבלו עדיפות על ההגדרות כאן.
                    </div>
                    <form id="chat-perms-settings">
                        <fieldset>
                            <legend>הרשאות בסיסיות</legend>
                            <div class="mb-3">
                                <label class="form-label" for="adminUids">מזהי מנהלים</label>
                                <input type="text" class="form-control" id="adminUids" placeholder="1,2,3">
                                <p class="form-text">מזהי משתמשים שיכולים לצפות בצ'אטים של אחרים (מופרדים בפסיק)</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label" for="allowChatGroup">קבוצת מותרים</label>
                                <input type="text" class="form-control" id="allowChatGroup" placeholder="allowChat">
                            </div>
                            <div class="mb-3">
                                <label class="form-label" for="denyChatGroup">קבוצת חסומים</label>
                                <input type="text" class="form-control" id="denyChatGroup" placeholder="denyChat">
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label" for="minReputation">מוניטין מינימלי</label>
                                    <input type="number" class="form-control" id="minReputation" value="10">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label" for="minPosts">פוסטים מינימליים</label>
                                    <input type="number" class="form-control" id="minPosts" value="5">
                                </div>
                            </div>
                        </fieldset>
                        <hr>
                        <fieldset>
                            <legend>אזהרת פרטיות</legend>
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" id="warningEnabled">
                                <label class="form-check-label" for="warningEnabled">הפעל אזהרת פרטיות</label>
                            </div>
                            <div class="mb-3">
                                <label class="form-label" for="warningMessage">טקסט האזהרה</label>
                                <textarea class="form-control" id="warningMessage" rows="2"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label" for="warningDisplayType">סוג תצוגה</label>
                                <select class="form-select" id="warningDisplayType">
                                    <option value="banner">באנר</option>
                                    <option value="popup">חלון קופץ</option>
                                    <option value="inline">טקסט בתוך הצ'אט</option>
                                </select>
                            </div>
                        </fieldset>
                        <hr>
                        <fieldset>
                            <legend>התראות מילים</legend>
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" id="keywordAlertsEnabled">
                                <label class="form-check-label" for="keywordAlertsEnabled">הפעל התראות מילים</label>
                            </div>
                            <div class="mb-3">
                                <label class="form-label" for="keywordList">רשימת מילים</label>
                                <textarea class="form-control" id="keywordList" rows="3" placeholder="מילה אחת בכל שורה"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label" for="alertRecipientUids">מקבלי התראות</label>
                                <input type="text" class="form-control" id="alertRecipientUids" placeholder="1,2">
                            </div>
                        </fieldset>
                        <hr>
                        <fieldset>
                            <legend>הודעות מותאמות</legend>
                            <div class="mb-3">
                                <label class="form-label" for="chatNotYetAllowedMessage">הודעה למשתמש חדש</label>
                                <input type="text" class="form-control" id="chatNotYetAllowedMessage">
                            </div>
                            <div class="mb-3">
                                <label class="form-label" for="chatDeniedMessage">הודעה למשתמש חסום</label>
                                <input type="text" class="form-control" id="chatDeniedMessage">
                            </div>
                        </fieldset>
                    </form>
                </div>
            </div>
        </div>
        <div class="col-lg-3">
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title">פעולות</h5>
                </div>
                <div class="card-body d-grid gap-2">
                    <button class="btn btn-primary" id="save" type="button">
                        <i class="fa fa-save"></i> שמור הגדרות
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
require(['alerts'], function(alerts) {
    // Load settings
    $.get(config.relative_path + '/api/admin/plugins/chat-perms/settings', function(s) {
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

    $('#save').on('click', function() {
        var data = {
            adminUids: $('#adminUids').val().split(',').map(function(x){return parseInt(x.trim(),10);}).filter(function(x){return !isNaN(x);}),
            allowChatGroup: $('#allowChatGroup').val(),
            denyChatGroup: $('#denyChatGroup').val(),
            minReputation: parseInt($('#minReputation').val(),10) || 10,
            minPosts: parseInt($('#minPosts').val(),10) || 5,
            warningEnabled: $('#warningEnabled').is(':checked'),
            warningMessage: $('#warningMessage').val(),
            warningDisplayType: $('#warningDisplayType').val(),
            keywordAlertsEnabled: $('#keywordAlertsEnabled').is(':checked'),
            keywordList: $('#keywordList').val().split('\n').map(function(x){return x.trim();}).filter(function(x){return x;}),
            alertRecipientUids: $('#alertRecipientUids').val().split(',').map(function(x){return parseInt(x.trim(),10);}).filter(function(x){return !isNaN(x);}),
            chatNotYetAllowedMessage: $('#chatNotYetAllowedMessage').val(),
            chatDeniedMessage: $('#chatDeniedMessage').val()
        };

        $.ajax({
            url: config.relative_path + '/api/admin/plugins/chat-perms/settings',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            headers: {'x-csrf-token': config.csrf_token},
            success: function() { alerts.success('הגדרות נשמרו בהצלחה'); },
            error: function() { alerts.error('שגיאה בשמירה'); }
        });
    });
});
</script>
