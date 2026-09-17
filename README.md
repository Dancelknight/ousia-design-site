# Ousia Design — portfolio website

Static HTML/CSS/JS portfolio site. No framework or build step required.

## Content model / mini CMS
Project content is maintained centrally in:

- `assets/projects-data.js` — English
- `assets/projects-data-de.js` — German

Each project contains:

- `slug` — unique URL key
- `number`
- `title`
- `shortTitle`
- `category`
- `location`
- `clientType`
- `role`
- `scope`
- `status`
- `cover` — homepage image filename
- `plan` — dedicated plan/drawing filename, or `null`
- `images` — project gallery images in display order
- `quote`
- `description`

Images live in `assets/images/`.

## Browser content manager
Open:

`/manage/`

The manager lets you:

- edit project descriptions and facts
- add a new project
- duplicate, reorder or remove projects
- set the cover image
- set a dedicated plan/drawing
- change the gallery image order
- switch between English and German
- preview the selected project
- download a ready-to-use `projects-data.js` or `projects-data-de.js`

The editor saves drafts locally in the browser. It intentionally does **not** contain GitHub credentials. When finished, replace the corresponding data file in GitHub with the downloaded file.

Image files themselves are uploaded to `assets/images/`.

## Add a new project
1. Upload the project images to `assets/images/`.
2. Open `/manage/` and click **New project**.
3. Enter the text, filenames and optional plan filename.
4. Edit both EN and DE versions.
5. Download both data files and replace the two files in `assets/`.
6. Commit.

That is all. New projects now use the generic project route automatically, so **no new project folder or HTML page is required**.

English project URLs use:

`/project/?p=your-project-slug`

German project URLs use:

`/de/project/?p=your-project-slug`

The old folders in `projects/` remain for backwards compatibility.

## Plans / drawings
Plans are no longer mixed into the normal gallery. If `plan` contains a filename, the project page shows a dedicated editorial **Plan / Drawing** section between the main project spread and the image gallery, similar to the portfolio PDF.

Current plan assets include:

- `plan_bolzano.webp`
- `plan_office.webp`
- `plan_modern.webp`
- `plan_terrace.webp`
- `plan_bathroom.webp`

Projects without an available plan currently use `plan: null`. Add the plan image later and enter its filename in the manager.

## Film / process video
Upload a compressed MP4, e.g. `assets/video/ousia-film.mp4`, then set `videoSrc` in `assets/site.js` and `assets/site-de.js`.

## Contact details
Edit the CONFIG block at the top of `assets/site.js` and `assets/site-de.js`.

## Strategic purpose
The site is structured as a portfolio for independent, complementary, project-based collaboration rather than as a conventional full-service agency site.
