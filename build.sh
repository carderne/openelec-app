#pass either dev, stage or prod as the fist argument
npm run $1

cp src/icons/favicon-1024.png dist
cp src/logo/oobica.png dist
cp openelec_video.mp4 dist
cp robots.txt dist
cp sitemap.xml dist
echo https://openelec.surge.sh > dist/CNAME

if [ $1 == stage ]; then
    aws s3 sync ./dist s3://stage.openelec.me/ --delete
fi

if [ $1 == prod ]; then
    aws s3 sync ./dist s3://openelec.me/ --delete
fi
