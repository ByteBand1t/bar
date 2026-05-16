# Sound-Dateien

Lege hier eine `notification.mp3` ab, um akustische Benachrichtigungen für neue Bestellungen zu aktivieren.

- **Pfad:** `public/sounds/notification.mp3`
- **Empfohlen:** kurze, deutliche Benachrichtigungstone (< 2 Sekunden)
- **Lautstärke:** wird über den Volume-Slider im Bar-Dashboard gesteuert (0–100%, persistiert in localStorage)
- **Aktivierung:** Beim ersten Öffnen von `/bar` erscheint ein Banner – einmaliger Klick startet den AudioContext (Browser-Anforderung)
