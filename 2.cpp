#include <iostream>
using namespace std;
class SoPhuc {
private:
    double thuc;   
    double ao;     

public:
    SoPhuc(double t = 0, double a = 0) {
        thuc = t;
        ao = a;
    }
    friend istream& operator>>(istream& in, SoPhuc& sp);
    friend ostream& operator<<(ostream& out, const SoPhuc& sp);
    SoPhuc operator+(const SoPhuc& b) const {
        return SoPhuc(thuc + b.thuc, ao + b.ao);
    }
    SoPhuc operator-(const SoPhuc& b) const {
        return SoPhuc(thuc - b.thuc, ao - b.ao);
    }
    friend SoPhuc operator*(const SoPhuc& a, const SoPhuc& b);
    friend SoPhuc operator/(const SoPhuc& a, const SoPhuc& b);
    friend bool operator==(const SoPhuc& a, const SoPhuc& b);
};
istream& operator>>(istream& in, SoPhuc& sp) {
    in >> sp.thuc >> sp.ao;
    return in;
}
ostream& operator<<(ostream& out, const SoPhuc& sp) {
    double a = sp.thuc;
    double b = sp.ao;

    if (a == 0 && b == 0)
        out << 0;
    else if (a == 0 && b > 0)
        out << b << "i";
    else if (a == 0 && b < 0)
        out << "-" << -b << "i";
    else if (b == 0)
        out << a;                       
    else if (a > 0 && b > 0)
        out << a << " + " << b << "i";
    else if (a > 0 && b < 0)
        out << a << " - " << -b << "i";
    else if (a < 0 && b > 0)
        out << a << " + " << b << "i";  
    else
        out << a << " - " << -b << "i"; 

    return out;
}
SoPhuc operator*(const SoPhuc& x, const SoPhuc& y) {
    double t = x.thuc * y.thuc - x.ao * y.ao;
    double a = x.thuc * y.ao + x.ao * y.thuc;
    return SoPhuc(t, a);
}
SoPhuc operator/(const SoPhuc& x, const SoPhuc& y) {
    double mau = y.thuc * y.thuc + y.ao * y.ao;
    if (mau == 0) {
        cout << "Khong the thuc hien phep tinh nay" << endl;
        return SoPhuc(0, 0);
    }
    double t = (x.thuc * y.thuc + x.ao * y.ao) / mau;
    double a = (x.ao * y.thuc - x.thuc * y.ao) / mau;
    return SoPhuc(t, a);
}

bool operator==(const SoPhuc& x, const SoPhuc& y) {
    return x.thuc == y.thuc && x.ao == y.ao;
}

int main() {
    SoPhuc a, b;

    cin >> a;   
    cin >> b;
    cout << endl;
    cout << "Tong hai so phuc: "  << a + b << endl << endl;
    cout << "Hieu hai so phuc: "  << a - b << endl << endl;
    cout << "Tich hai so phuc: "  << a * b << endl << endl;
    if (b == SoPhuc(0, 0))
        cout << "Thuong hai so phuc: Khong the thuc hien phep tinh nay" << endl << endl;
    else
        cout << "Thuong hai so phuc: " << a / b << endl << endl;

    cout << "Hai so phuc tren co bang nhau khong? ";
    if (a == b) cout << "Co" << endl;
    else        cout << "Khong" << endl;

    return 0;
}
