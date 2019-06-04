#pass either dev, stage or prod as the fist argument
npm run $1

cp src/icons/favicon-1024.png dist
cp src/logo/oobica.png dist
cp openelec_video.mp4 dist
cp robots.txt dist
cp sitemap.xml dist

url=$(sed -n 's/^'$1': //p' config.yml)
prof=$(sed -n 's/^profile: //p' config.yml)

if [ $1 == dev ]; then
    light-server -s dist -b localhost
elif [ $1 == stage ]; then
    aws s3 sync ./dist $url --delete --profile $prof
elif [ $1 == prod ]; then
    aws s3 sync ./dist $url --delete --profile $prof
fi
