Name:           ${AppName}
Version:        1.0.0
Release:        1
Summary:        Cheems Bonk Game (PWA)
License:        MIT
BuildArch:      noarch

%description
A lightweight Linux native wrapper for the Cheems Bonk PWA.

%prep
%build
%install
mkdir -p %{buildroot}
cp -a ${Workspace}/deb-package/usr %{buildroot}/

%files
/usr/bin/${AppName}
/usr/share/applications/${AppName}.desktop
/usr/share/icons/hicolor/512x512/apps/${AppName}.png
