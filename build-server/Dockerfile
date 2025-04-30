#build server is light weight docker image where we going to build projects/code
FROM ubuntu:focal

#update all the packages
RUN apt-get update

#install the curl software/package inside the container -y(auto-approve)
RUN apt-get install -y curl

#nodejs setup 20
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get upgrade -y

#install nodejs
RUN apt-get install -y nodejs

#install git
RUN apt-get install git -y

#now after all this we will run a script
WORKDIR /home/app
#copy main.sh here in main.sh(ubuntu/container)
COPY main.sh main.sh
COPY script.js script.js
COPY package*.json .

RUN npm install

#now we have to give executable permission
RUN chmod +x main.sh
RUN chmod +x script.js
ENTRYPOINT [ "/home/app/main.sh" ]

