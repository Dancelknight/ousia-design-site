# Ousia Design — portfolio website

Static HTML/CSS/JS portfolio site. No framework or build step required.

## Content model / mini CMS
All project content is maintained in one file:

`assets/projects-data.js`

For an existing project, edit the corresponding object there: title, location, client type, role, scope, status, quote, description, cover and image list.

Images live in:

`assets/images/`

To replace an image without touching code, upload a new image with the same filename.

### Add a new project
1. Add the images to `assets/images/`.
2. Copy one project object in `assets/projects-data.js` and give it a unique `slug`.
3. Copy any existing folder inside `projects/`, rename it to the same slug, and change only `data-project-slug="..."` in its `index.html`.
4. Commit. The project appears automatically on the homepage.

## Film / process video
Upload a compressed MP4, e.g. `assets/video/ousia-film.mp4`, then set `videoSrc` in `assets/site.js`.

## Contact details
Edit the CONFIG block at the top of `assets/site.js`.

## Strategic purpose
The site is structured as a portfolio for independent, complementary, project-based collaboration rather than as a conventional full-service agency site.
