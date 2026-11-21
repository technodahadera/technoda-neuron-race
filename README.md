# מרוץ האות העצבי | טכנודע

משחק כיתתי חי לסיכום מערכים 9 ו־10. המורה פותח חדר ומקרין את המסך. עד 60 משתתפים מצטרפים עם קוד או QR וכינוי. כל תשובה נכונה מקדמת את האות לתא המטרה. שאלות שהוחמצו חוזרות אחרי סבב ראשון. הראשון שמשלים את כל 18 השאלות מגיע ראשון ליעד.

## Source layout

- `public/` contains the static Hebrew interface. Publish these files at the root of the GitHub Pages branch.
- `worker/index.js` implements the room and answer API. `worker/questions.js` is its question bank.
- `drizzle/0000_race.sql` initializes D1. The database binding is `DB`.
- Run `bash scripts/build.sh` and `node scripts/validate-artifact.mjs` to build and check the Worker. The result is in `dist/server/index.js`. Apply the schema to the configured D1 database when deploying the Worker on another host. Set the API origin in `public/app.js` and update the allowed Pages origin in `worker/index.js` if the public URLs change.

The app uses nicknames and expires rooms after four hours. It cleans up expired records the next time someone creates a room. QR Code Generator by Kazuhiko Arase, MIT. Rubik by Hubert & Fischer, licensed under the SIL Open Font License.
