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
                        <!-- Basic Permissions -->
                        <fieldset>
                            <legend>הרשאות בסיסיות</legend>
                            
                            <div class="mb-3">
                                <label class="form-label" for="adminUids">מזהי מנהלים (ADMIN_UIDS)</label>
                                <input type="text" class="form-control" id="adminUids" name="adminUids" data-key="adminUids" placeholder="1,2,3">
                                <p class="form-text">מזהי משתמשים שיכולים לצפות בצ'אטים של אחרים (מופרדים בפסיק)</p>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label" for="allowChatGroup">קבוצת מותרים</label>
                                <input type="text" class="form-control" id="allowChatGroup" name="allowChatGroup" data-key="allowChatGroup" placeholder="allowChat">
                                <p class="form-text">שם הקבוצה שמותר להם צ'אט ללא תנאים</p>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label" for="denyChatGroup">קבוצת חסומים</label>
                                <input type="text" class="form-control" id="denyChatGroup" name="denyChatGroup" data-key="denyChatGroup" placeholder="denyChat">
                                <p class="form-text">שם הקבוצה שחסומים מצ'אט</p>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label" for="minReputation">מוניטין מינימלי</label>
                                    <input type="number" class="form-control" id="minReputation" name="minReputation" data-key="minReputation" value="10">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label" for="minPosts">פוסטים מינימליים</label>
                                    <input type="number" class="form-control" id="minPosts" name="minPosts" data-key="minPosts" value="5">
                                </div>
                            </div>
                        </fieldset>
                        
                        <hr>
                        
                        <!-- Privacy Warning -->
                        <fieldset>
                            <legend>אזהרת פרטיות</legend>
                            
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" id="warningEnabled" name="warningEnabled" data-key="warningEnabled">
                                <label class="form-check-label" for="warningEnabled">הפעל אזהרת פרטיות</label>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label" for="warningMessage">טקסט האזהרה</label>
                                <textarea class="form-control" id="warningMessage" name="warningMessage" data-key="warningMessage" rows="2">שים לב: ההנהלה יכולה לצפות בהודעות הצ'אט</textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label" for="warningDisplayType">סוג תצוגה</label>
                                <select class="form-select" id="warningDisplayType" name="warningDisplayType" data-key="warningDisplayType">
                                    <option value="banner">באנר</option>
                                    <option value="popup">חלון קופץ</option>
                                    <option value="inline">טקסט בתוך הצ'אט</option>
                                </select>
                            </div>
                        </fieldset>
                        
                        <hr>
                        
                        <!-- Keyword Alerts -->
                        <fieldset>
                            <legend>התראות מילים</legend>
                            
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" id="keywordAlertsEnabled" name="keywordAlertsEnabled" data-key="keywordAlertsEnabled">
                                <label class="form-check-label" for="keywordAlertsEnabled">הפעל התראות מילים</label>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label" for="keywordList">רשימת מילים</label>
                                <textarea class="form-control" id="keywordList" name="keywordList" data-key="keywordList" rows="3" placeholder="מילה1&#10;מילה2&#10;מילה3"></textarea>
                                <p class="form-text">מילה אחת בכל שורה</p>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label" for="alertRecipientUids">מקבלי התראות</label>
                                <input type="text" class="form-control" id="alertRecipientUids" name="alertRecipientUids" data-key="alertRecipientUids" placeholder="1,2">
                                <p class="form-text">מזהי משתמשים שיקבלו התראות (מופרדים בפסיק)</p>
                            </div>
                        </fieldset>
                        
                        <hr>
                        
                        <!-- Custom Messages -->
                        <fieldset>
                            <legend>הודעות מותאמות</legend>
                            
                            <div class="mb-3">
                                <label class="form-label" for="chatNotYetAllowedMessage">הודעה למשתמש חדש</label>
                                <input type="text" class="form-control" id="chatNotYetAllowedMessage" name="chatNotYetAllowedMessage" data-key="chatNotYetAllowedMessage" placeholder="עליך לצבור וותק לפני שתוכל להשתמש בצ'אט">
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label" for="chatDeniedMessage">הודעה למשתמש חסום</label>
                                <input type="text" class="form-control" id="chatDeniedMessage" name="chatDeniedMessage" data-key="chatDeniedMessage" placeholder="הגישה שלך לצ'אט נחסמה">
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
