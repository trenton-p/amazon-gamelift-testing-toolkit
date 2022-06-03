
#!/bin/bash
rpm -Uvh https://packages.microsoft.com/config/centos/7/packages-microsoft-prod.rpm
yum -y install dotnet-sdk-5.0 openssl-libs unzip yum-utils

mkdir -p mono_dependencies
cd mono_dependencies
rpm --import "http://keyserver.ubuntu.com/pks/lookup?op=get&search=0x3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF"
yum-config-manager --add-repo http://download.mono-project.com/repo/centos/
yum -y install mono-devel mono-complete nuget
cd ..
rm -rf mono_dependencies

curl -O https://gamelift-release.s3-us-west-2.amazonaws.com/GameLift_06_03_2021.zip
mkdir DLL
mkdir aws-gamelift-sdk-temp
unzip GameLift_06_03_2021.zip -d aws-gamelift-sdk-temp
rm GameLift_06_03_2021.zip
cd aws-gamelift-sdk-temp/GameLift-SDK-Release-4.0.2/GameLift-CSharp-ServerSDK-4.0.2/
nuget restore
msbuild GameLiftServerSDKNet45.sln -property:Configuration=Release
cp Net45/bin/Release/* ../../../DLL/
cd ../../..
rm -rf aws-gamelift-sdk-temp

dotnet publish -c SampleGameBuild.csproj -r linux-x64 --self-contained true
cp ./log4net.config ./bin/SampleGameBuild.csproj/net5.0/linux-x64/
cp ./QuizConfig.json ./bin/SampleGameBuild.csproj/net5.0/linux-x64/