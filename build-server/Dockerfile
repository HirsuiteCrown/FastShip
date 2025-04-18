FROM ubuntu:focal

#update all the packages
RUN apt-get update
RUN apt-get install -y curl

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
ENTRYPOINT [ "/home/app/main.sh" ]

