npm run $1

cp src/icons/favicon-1024.png dist
cp src/logo/oobica.png dist
cp openelec_video.mp4 dist
cp robots.txt dist
cp sitemap.xml dist
cp -r data/ dist/

url=$(sed -n 's/^'$1': //p' config.yml)
prof=$(sed -n 's/^profile: //p' config.yml)
